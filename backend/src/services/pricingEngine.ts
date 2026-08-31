import { prisma } from '../lib/prisma.js';

// Seasonal indices by crop (month 0-11 = Jan-Dec)
const SEASONAL_INDICES: Record<string, number[]> = {
  'Tomato':      [1.0, 0.95, 0.90, 0.85, 0.90, 1.10, 1.20, 1.15, 1.10, 1.00, 0.95, 1.00],
  'Potato':      [1.05, 1.00, 0.95, 0.90, 0.90, 0.95, 1.00, 1.00, 1.05, 1.10, 1.15, 1.10],
  'Onion':       [1.15, 1.20, 1.10, 0.90, 0.85, 0.90, 0.95, 1.00, 1.05, 1.10, 1.15, 1.20],
  'Wheat':       [0.95, 0.95, 1.00, 1.10, 1.05, 0.90, 0.85, 0.85, 0.90, 0.95, 1.00, 0.95],
  'Soybean':     [0.90, 0.90, 0.90, 0.90, 0.95, 0.95, 1.00, 1.05, 1.15, 1.20, 1.15, 1.00],
  'Rice':        [0.95, 0.95, 1.00, 1.00, 0.95, 0.90, 0.90, 0.95, 1.10, 1.15, 1.10, 1.00],
  'Chilli':      [1.15, 1.10, 1.00, 0.90, 0.85, 0.85, 0.90, 0.95, 1.00, 1.05, 1.15, 1.20],
  'Cauliflower': [1.10, 1.05, 0.95, 0.85, 0.80, 0.80, 0.85, 0.90, 0.95, 1.10, 1.20, 1.15],
  'Cabbage':     [1.10, 1.05, 0.95, 0.85, 0.80, 0.80, 0.85, 0.90, 0.95, 1.10, 1.20, 1.15],
  'Mango':       [0.70, 0.75, 0.85, 1.00, 1.25, 1.30, 1.20, 0.90, 0.70, 0.65, 0.65, 0.70],
};

interface PriceRecommendationResult {
  recommendedPrice: number;
  priceRange: { min: number; max: number };
  confidence: number;
  demandLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  factors: Array<{ name: string; impact: string; value: string; direction: 'up' | 'down' | 'neutral' }>;
  explanation: string;
}

export async function getPriceRecommendation(
  crop: string,
  quantity: number,
  location: string,
  quality: string,
  harvestDate: Date
): Promise<PriceRecommendationResult> {
  // 1. Find the product
  const product = await prisma.product.findFirst({ where: { name: { contains: crop } } });
  if (!product) throw new Error(`Product "${crop}" not found in database`);

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // 2. Fetch historical market prices (last 30 days)
  const allMarketPrices = await prisma.marketPrice.findMany({
    where: { productId: product.id, date: { gte: thirtyDaysAgo } },
    orderBy: { date: 'desc' }
  });

  const localMarketPrices = allMarketPrices.filter(mp => mp.location === location);
  const recentPrices = allMarketPrices.filter(mp => mp.date >= sevenDaysAgo);

  // 3. Calculate BASE PRICE (weighted average, recent prices weighted more)
  let basePrice: number;
  if (allMarketPrices.length > 0) {
    let weightedSum = 0;
    let weightTotal = 0;
    for (let i = 0; i < allMarketPrices.length; i++) {
      const daysDiff = Math.max(1, Math.floor((now.getTime() - allMarketPrices[i].date.getTime()) / (24 * 60 * 60 * 1000)));
      const weight = 1 / Math.sqrt(daysDiff); // More recent = higher weight
      weightedSum += allMarketPrices[i].price * weight;
      weightTotal += weight;
    }
    basePrice = weightedSum / weightTotal;
  } else {
    basePrice = 50; // Absolute fallback
  }

  const factors: PriceRecommendationResult['factors'] = [];
  let totalAdjustment = 0;

  // 4. DEMAND ADJUSTMENT (order velocity: recent 7 days vs previous 7 days)
  const recentOrders = await prisma.orderItem.findMany({
    where: {
      listing: { productId: product.id },
      order: { createdAt: { gte: sevenDaysAgo } }
    },
    include: { order: true }
  });
  const prevOrders = await prisma.orderItem.findMany({
    where: {
      listing: { productId: product.id },
      order: { createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } }
    },
    include: { order: true }
  });

  const recentDemandQty = recentOrders.reduce((sum, oi) => sum + oi.quantity, 0);
  const prevDemandQty = prevOrders.reduce((sum, oi) => sum + oi.quantity, 0);
  
  let demandAdjustment = 0;
  let demandChangePercent = 0;
  if (prevDemandQty > 0) {
    demandChangePercent = ((recentDemandQty - prevDemandQty) / prevDemandQty) * 100;
    demandAdjustment = Math.max(-0.15, Math.min(0.15, demandChangePercent / 100 * 0.8));
  } else if (recentDemandQty > 0) {
    demandChangePercent = 25;
    demandAdjustment = 0.08;
  }
  
  totalAdjustment += demandAdjustment;
  factors.push({
    name: 'Demand Trend',
    impact: `${demandAdjustment >= 0 ? '+' : ''}${(demandAdjustment * 100).toFixed(1)}%`,
    value: `${demandChangePercent >= 0 ? '+' : ''}${demandChangePercent.toFixed(0)}% order velocity`,
    direction: demandAdjustment > 0.01 ? 'up' : demandAdjustment < -0.01 ? 'down' : 'neutral'
  });

  // 5. SUPPLY ADJUSTMENT (current active supply vs typical)
  const activeListings = await prisma.productListing.findMany({
    where: { productId: product.id, status: 'ACTIVE' }
  });
  const localListings = activeListings.filter(l => l.location === location);
  const totalSupply = activeListings.reduce((sum, l) => sum + l.quantity, 0);
  const localSupply = localListings.reduce((sum, l) => sum + l.quantity, 0);
  
  // Compare with average listing count
  const avgListingCount = 5; // baseline expectation
  const supplyRatio = activeListings.length / avgListingCount;
  let supplyAdjustment = 0;
  if (supplyRatio < 0.7) {
    supplyAdjustment = 0.08; // Low supply = higher price
  } else if (supplyRatio > 1.5) {
    supplyAdjustment = -0.06; // High supply = lower price
  } else {
    supplyAdjustment = (1 - supplyRatio) * 0.05;
  }
  
  totalAdjustment += supplyAdjustment;
  factors.push({
    name: 'Local Supply',
    impact: `${supplyAdjustment >= 0 ? '+' : ''}${(supplyAdjustment * 100).toFixed(1)}%`,
    value: `${activeListings.length} active listings, ${totalSupply.toFixed(0)} kg available`,
    direction: supplyAdjustment > 0.01 ? 'up' : supplyAdjustment < -0.01 ? 'down' : 'neutral'
  });

  // 6. SEASONAL ADJUSTMENT
  const month = harvestDate.getMonth();
  const seasonalIndices = SEASONAL_INDICES[crop] || Array(12).fill(1.0);
  const seasonalFactor = seasonalIndices[month];
  const seasonalAdjustment = seasonalFactor - 1.0;
  
  totalAdjustment += seasonalAdjustment;
  factors.push({
    name: 'Seasonal Factor',
    impact: `${seasonalAdjustment >= 0 ? '+' : ''}${(seasonalAdjustment * 100).toFixed(1)}%`,
    value: `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][month]} seasonal index: ${seasonalFactor.toFixed(2)}`,
    direction: seasonalAdjustment > 0.02 ? 'up' : seasonalAdjustment < -0.02 ? 'down' : 'neutral'
  });

  // 7. QUALITY ADJUSTMENT
  let qualityAdjustment = 0;
  if (quality === 'Grade A') qualityAdjustment = 0.05;
  else if (quality === 'Grade C') qualityAdjustment = -0.08;
  else qualityAdjustment = 0;
  
  totalAdjustment += qualityAdjustment;
  factors.push({
    name: 'Quality Grade',
    impact: `${qualityAdjustment >= 0 ? '+' : ''}${(qualityAdjustment * 100).toFixed(1)}%`,
    value: quality,
    direction: qualityAdjustment > 0 ? 'up' : qualityAdjustment < 0 ? 'down' : 'neutral'
  });

  // 8. REGIONAL ADJUSTMENT
  let regionalAdjustment = 0;
  if (localMarketPrices.length > 0 && allMarketPrices.length > 0) {
    const localAvg = localMarketPrices.reduce((s, p) => s + p.price, 0) / localMarketPrices.length;
    const overallAvg = allMarketPrices.reduce((s, p) => s + p.price, 0) / allMarketPrices.length;
    if (overallAvg > 0) {
      regionalAdjustment = Math.max(-0.10, Math.min(0.10, (localAvg - overallAvg) / overallAvg));
    }
  }
  
  totalAdjustment += regionalAdjustment;
  factors.push({
    name: 'Regional Pricing',
    impact: `${regionalAdjustment >= 0 ? '+' : ''}${(regionalAdjustment * 100).toFixed(1)}%`,
    value: `${location} vs. national average`,
    direction: regionalAdjustment > 0.01 ? 'up' : regionalAdjustment < -0.01 ? 'down' : 'neutral'
  });

  // 9. QUANTITY ADJUSTMENT (larger quantities may get slight discount)
  let quantityAdjustment = 0;
  if (quantity > 500) quantityAdjustment = -0.03;
  else if (quantity > 200) quantityAdjustment = -0.01;
  else if (quantity < 50) quantityAdjustment = 0.02;
  
  totalAdjustment += quantityAdjustment;
  if (Math.abs(quantityAdjustment) > 0) {
    factors.push({
      name: 'Volume Factor',
      impact: `${quantityAdjustment >= 0 ? '+' : ''}${(quantityAdjustment * 100).toFixed(1)}%`,
      value: `${quantity} ${product.unit} listed`,
      direction: quantityAdjustment > 0 ? 'up' : 'down'
    });
  }

  // 10. CALCULATE FINAL PRICE
  const recommendedPrice = Math.round(basePrice * (1 + totalAdjustment) * 100) / 100;
  const priceRange = {
    min: Math.round(recommendedPrice * 0.96 * 100) / 100,
    max: Math.round(recommendedPrice * 1.04 * 100) / 100
  };

  // 11. CONFIDENCE CALCULATION
  let confidence = 50; // Base confidence
  if (allMarketPrices.length > 20) confidence += 15;
  else if (allMarketPrices.length > 5) confidence += 8;
  if (localMarketPrices.length > 5) confidence += 10;
  else if (localMarketPrices.length > 0) confidence += 5;
  if (recentOrders.length > 5) confidence += 10;
  else if (recentOrders.length > 0) confidence += 5;
  if (recentPrices.length > 5) confidence += 8;
  confidence = Math.min(95, confidence);

  // 12. DEMAND LEVEL
  let demandLevel: PriceRecommendationResult['demandLevel'] = 'MEDIUM';
  if (demandChangePercent > 20) demandLevel = 'VERY_HIGH';
  else if (demandChangePercent > 10 || recentDemandQty > prevDemandQty * 1.1) demandLevel = 'HIGH';
  else if (demandChangePercent < -10) demandLevel = 'LOW';

  // 13. BUILD EXPLANATION
  const explanationParts = [
    `Based on ${allMarketPrices.length} market price records over 30 days.`,
    localMarketPrices.length > 0 ? `${localMarketPrices.length} records from ${location}.` : '',
    `Recent market average: ₹${basePrice.toFixed(2)}/${product.unit}.`,
    demandChangePercent !== 0 ? `Demand trend: ${demandChangePercent >= 0 ? '+' : ''}${demandChangePercent.toFixed(0)}% (7-day order velocity vs prior period).` : '',
    supplyAdjustment !== 0 ? `Local supply: ${activeListings.length} active listings with ${totalSupply.toFixed(0)} kg available.` : '',
    seasonalAdjustment !== 0 ? `Seasonal adjustment: ${seasonalAdjustment > 0 ? '+' : ''}${(seasonalAdjustment * 100).toFixed(0)}% for ${['January','February','March','April','May','June','July','August','September','October','November','December'][month]}.` : '',
    qualityAdjustment !== 0 ? `Quality adjustment: ${qualityAdjustment > 0 ? '+' : ''}₹${(basePrice * qualityAdjustment).toFixed(2)} for ${quality}.` : '',
    regionalAdjustment !== 0 ? `Regional pricing: ${location} ${regionalAdjustment > 0 ? 'above' : 'below'} national average by ${Math.abs(regionalAdjustment * 100).toFixed(1)}%.` : '',
  ].filter(Boolean);

  return {
    recommendedPrice,
    priceRange,
    confidence,
    demandLevel,
    factors,
    explanation: explanationParts.join(' ')
  };
}
