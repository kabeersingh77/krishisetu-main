import { prisma } from '../lib/prisma.js';

export async function getConsumerRecommendations(userId: string, limit: number = 8) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return [];

  // Get user's past purchases
  const pastOrders = await prisma.orderItem.findMany({
    where: { order: { buyerId: userId } },
    include: { listing: { include: { product: true } } },
    orderBy: { order: { createdAt: 'desc' } },
    take: 20
  });

  // Get frequently purchased product IDs
  const purchasedProductIds = [...new Set(pastOrders.map(oi => oi.listing.productId))];

  // Get popular products based on order count
  const popularListings = await prisma.productListing.findMany({
    where: { status: 'ACTIVE' },
    include: {
      product: true,
      farmer: { include: { user: true } },
      fpo: { include: { user: true } },
      _count: { select: { orderItems: true } }
    },
    orderBy: { orderItems: { _count: 'desc' } },
    take: limit * 2
  });

  // Score and rank listings
  const scored = popularListings.map(listing => {
    let score = 0;
    // Popularity bonus
    score += (listing._count?.orderItems || 0) * 10;
    // Location proximity bonus
    if (user.location && listing.location === user.location) score += 30;
    // Past purchase affinity
    if (purchasedProductIds.includes(listing.productId)) score += 20;
    // Freshness bonus (within 7 days of harvest)
    const daysSinceHarvest = Math.floor((Date.now() - listing.harvestDate.getTime()) / (86400000));
    if (daysSinceHarvest <= 7) score += 15;
    else if (daysSinceHarvest <= 14) score += 5;
    // Organic bonus
    if (listing.organic) score += 5;
    // Quality bonus
    if (listing.quality === 'Grade A') score += 10;

    return { listing, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(s => s.listing);
}

export async function getFarmerRecommendations(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { farmerProfile: true }
  });
  if (!user?.farmerProfile) return { crops: [], insights: [] };

  const location = user.farmerProfile.farmLocation;
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);

  // Find crops with increasing demand
  const products = await prisma.product.findMany();
  const cropInsights: Array<{ crop: string; demandTrend: string; avgPrice: number; recommendation: string }> = [];

  for (const product of products) {
    const recentOrders = await prisma.orderItem.count({
      where: { listing: { productId: product.id }, order: { createdAt: { gte: sevenDaysAgo } } }
    });
    const prevOrders = await prisma.orderItem.count({
      where: { listing: { productId: product.id }, order: { createdAt: { gte: thirtyDaysAgo, lt: sevenDaysAgo } } }
    });
    const weeklyPrev = prevOrders / 3.3; // Normalize to weekly
    const growth = weeklyPrev > 0 ? ((recentOrders - weeklyPrev) / weeklyPrev * 100) : (recentOrders > 0 ? 15 : 0);

    const prices = await prisma.marketPrice.findMany({
      where: { productId: product.id, date: { gte: sevenDaysAgo } }
    });
    const avgPrice = prices.length > 0 ? prices.reduce((s, p) => s + p.price, 0) / prices.length : 0;

    let recommendation = '';
    if (growth > 15) recommendation = `High demand growth. Good opportunity to list ${product.name}.`;
    else if (growth > 5) recommendation = `Moderate demand increase for ${product.name}.`;
    else if (growth < -10) recommendation = `Demand declining. Consider competitive pricing for ${product.name}.`;

    if (recommendation) {
      cropInsights.push({
        crop: product.name,
        demandTrend: growth > 5 ? 'RISING' : growth < -5 ? 'FALLING' : 'STABLE',
        avgPrice: Math.round(avgPrice * 100) / 100,
        recommendation
      });
    }
  }

  // Sort by demand growth (rising first)
  cropInsights.sort((a, b) => (b.demandTrend === 'RISING' ? 1 : 0) - (a.demandTrend === 'RISING' ? 1 : 0));

  return {
    crops: cropInsights.slice(0, 5),
    insights: [
      cropInsights.filter(c => c.demandTrend === 'RISING').length > 0
        ? `${cropInsights.filter(c => c.demandTrend === 'RISING').length} crops showing rising demand in your region.`
        : 'Market conditions are stable in your region.',
    ]
  };
}
