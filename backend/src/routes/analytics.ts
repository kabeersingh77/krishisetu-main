import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// GET /api/analytics/farmer — Farmer dashboard metrics
router.get('/farmer', requireRole('FARMER', 'FPO'), async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, include: { farmerProfile: true, fpo: true } });
    const profileId = user?.farmerProfile?.id;
    const fpoId = user?.fpo?.id;
    if (!profileId && !fpoId) return res.status(404).json({ error: 'Profile not found' });

    const listingWhere = profileId ? { farmerId: profileId } : { fpoId: fpoId };

    const listings = await prisma.productListing.findMany({
      where: listingWhere,
      include: { product: true, orderItems: { include: { order: true } } }
    });

    const activeListings = listings.filter(l => l.status === 'ACTIVE').length;
    let totalRevenue = 0;
    let totalOrderCount = 0;
    let totalQuantitySold = 0;
    const orderSet = new Set<string>();

    listings.forEach(l => {
      l.orderItems.forEach(oi => {
        totalRevenue += oi.price * oi.quantity;
        totalQuantitySold += oi.quantity;
        orderSet.add(oi.orderId);
      });
    });
    totalOrderCount = orderSet.size;

    // Pending deliveries
    const pendingDeliveries = await prisma.delivery.count({
      where: {
        status: { in: ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'] },
        order: { items: { some: { listing: listingWhere } } }
      }
    });

    // Revenue over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const revenueByDay: Record<string, number> = {};
    for (let d = 0; d < 30; d++) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      revenueByDay[date.toISOString().split('T')[0]] = 0;
    }
    
    listings.forEach(l => {
      l.orderItems.forEach(oi => {
        if (oi.order.createdAt >= thirtyDaysAgo) {
          const day = oi.order.createdAt.toISOString().split('T')[0];
          if (revenueByDay[day] !== undefined) {
            revenueByDay[day] += oi.price * oi.quantity;
          }
        }
      });
    });

    const revenueChart = Object.entries(revenueByDay)
      .map(([date, revenue]) => ({ date, revenue: Math.round(revenue * 100) / 100 }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Recent orders
    const recentOrders = await prisma.order.findMany({
      where: { items: { some: { listing: listingWhere } } },
      include: { 
        buyer: { select: { name: true } },
        items: { include: { listing: { include: { product: true } } } }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    res.json({
      activeListings,
      totalOrders: totalOrderCount,
      revenue: Math.round(totalRevenue * 100) / 100,
      pendingDeliveries,
      produceSold: Math.round(totalQuantitySold),
      avgRealization: totalQuantitySold > 0 ? Math.round(totalRevenue / totalQuantitySold * 100) / 100 : 0,
      revenueChart,
      recentOrders: recentOrders.map(o => ({
        id: o.id,
        buyer: o.buyer.name,
        items: o.items.map(i => ({ crop: i.listing.product.name, quantity: i.quantity, price: i.price })),
        total: o.total,
        status: o.status,
        date: o.createdAt
      }))
    });
  } catch (error: any) {
    console.error('Farmer analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// GET /api/analytics/consumer — Consumer dashboard metrics
router.get('/consumer', async (req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: { buyerId: req.user!.id },
      include: { items: true, delivery: true }
    });

    const activeOrders = orders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status)).length;
    const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);

    res.json({
      totalOrders: orders.length,
      activeOrders,
      totalSpent: Math.round(totalSpent * 100) / 100,
      delivered: orders.filter(o => o.status === 'DELIVERED').length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// GET /api/analytics/admin — Admin dashboard metrics
router.get('/admin', requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    // User counts by role
    const totalUsers = await prisma.user.count();
    const farmers = await prisma.user.count({ where: { role: 'FARMER' } });
    const fpos = await prisma.user.count({ where: { role: 'FPO' } });
    const consumers = await prisma.user.count({ where: { role: 'CONSUMER' } });
    const bulkBuyers = await prisma.user.count({ where: { role: 'BULK_BUYER' } });

    // Listings & orders
    const activeListings = await prisma.productListing.count({ where: { status: 'ACTIVE' } });
    const totalListings = await prisma.productListing.count();
    const orders = await prisma.order.findMany({ include: { items: { include: { listing: { include: { product: true } } } } } });
    const totalOrders = orders.length;
    const gmv = Math.round(orders.reduce((sum, o) => sum + o.total, 0) * 100) / 100;

    // Farmer earnings
    let farmerEarnings = 0;
    orders.forEach(o => {
      o.items.forEach(i => { farmerEarnings += i.price * i.quantity; });
    });
    farmerEarnings = Math.round(farmerEarnings * 100) / 100;

    // Active deliveries
    const activeDeliveries = await prisma.delivery.count({
      where: { status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'] } }
    });

    // Orders over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const ordersByDay: Record<string, { count: number; gmv: number }> = {};
    for (let d = 0; d < 30; d++) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      ordersByDay[date.toISOString().split('T')[0]] = { count: 0, gmv: 0 };
    }
    orders.forEach(o => {
      if (o.createdAt >= thirtyDaysAgo) {
        const day = o.createdAt.toISOString().split('T')[0];
        if (ordersByDay[day]) {
          ordersByDay[day].count++;
          ordersByDay[day].gmv += o.total;
        }
      }
    });
    const ordersChart = Object.entries(ordersByDay)
      .map(([date, data]) => ({ date, orders: data.count, gmv: Math.round(data.gmv) }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Crop demand distribution
    const cropDemand: Record<string, number> = {};
    orders.forEach(o => {
      o.items.forEach(i => {
        const crop = i.listing.product.name;
        cropDemand[crop] = (cropDemand[crop] || 0) + i.quantity;
      });
    });
    const cropDemandChart = Object.entries(cropDemand)
      .map(([crop, quantity]) => ({ crop, quantity: Math.round(quantity) }))
      .sort((a, b) => b.quantity - a.quantity);

    // Regional breakdown
    const regionalOrders: Record<string, number> = {};
    orders.forEach(o => {
      const city = o.shippingCity || 'Unknown';
      regionalOrders[city] = (regionalOrders[city] || 0) + 1;
    });
    const regionalChart = Object.entries(regionalOrders)
      .map(([city, count]) => ({ city, orders: count }))
      .sort((a, b) => b.orders - a.orders);

    res.json({
      totalUsers, farmers, fpos, consumers, bulkBuyers,
      activeListings, totalListings, totalOrders, gmv, farmerEarnings, activeDeliveries,
      ordersChart, cropDemandChart, regionalChart
    });
  } catch (error: any) {
    console.error('Admin analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// GET /api/analytics/fpo — FPO dashboard metrics
router.get('/fpo', requireRole('FPO'), async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, include: { fpo: true } });
    if (!user?.fpo) return res.status(404).json({ error: 'FPO not found' });

    const listings = await prisma.productListing.findMany({
      where: { fpoId: user.fpo.id },
      include: { product: true, orderItems: { include: { order: true } } }
    });

    const activeSupply = listings.filter(l => l.status === 'ACTIVE').reduce((sum, l) => sum + l.quantity, 0);
    let revenue = 0;
    const orderSet = new Set<string>();
    listings.forEach(l => {
      l.orderItems.forEach(oi => {
        revenue += oi.price * oi.quantity;
        orderSet.add(oi.orderId);
      });
    });

    res.json({
      members: user.fpo.memberCount,
      activeSupply: Math.round(activeSupply),
      activeListings: listings.filter(l => l.status === 'ACTIVE').length,
      totalOrders: orderSet.size,
      revenue: Math.round(revenue * 100) / 100,
      avgFarmerRealization: orderSet.size > 0 ? Math.round(revenue / orderSet.size * 100) / 100 : 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch FPO analytics' });
  }
});

// GET /api/analytics/impact — Platform impact metrics
router.get('/impact', async (req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: { status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } },
      include: { items: { include: { listing: { include: { product: true } } } } }
    });

    // Calculate total produce traded
    let totalProduceKg = 0;
    let totalFarmerEarnings = 0;
    let totalConsumerSpent = 0;
    orders.forEach(o => {
      totalConsumerSpent += o.total;
      o.items.forEach(i => {
        totalProduceKg += i.quantity;
        totalFarmerEarnings += i.price * i.quantity;
      });
    });

    // Average farmer realization (% of consumer price)
    const avgFarmerRealization = totalConsumerSpent > 0 ? (totalFarmerEarnings / totalConsumerSpent * 100) : 85;

    // Traditional model comparison (simulate)
    // In traditional chain, farmer gets ~30-40% of consumer price
    // In KrishiSetu, farmer gets ~80-90% (platform fee ~5-10%, logistics ~5-10%)
    const traditionalFarmerShare = 35; // percentage
    const krishisetuFarmerShare = Math.round(avgFarmerRealization);
    const consumerSavings = Math.round((1 - krishisetuFarmerShare / 100 / (traditionalFarmerShare / 100)) * -100);

    // Deliveries
    const deliveries = await prisma.delivery.findMany();
    const completedDeliveries = deliveries.filter(d => d.status === 'DELIVERED');
    const avgFulfillmentDist = completedDeliveries.length > 0
      ? completedDeliveries.reduce((sum, d) => sum + (d.distance || 0), 0) / completedDeliveries.length
      : 0;

    const farmers = await prisma.user.count({ where: { role: 'FARMER' } });
    const fpoMembers = await prisma.fPO.aggregate({ _sum: { memberCount: true } });

    res.json({
      farmersConnected: farmers + (fpoMembers._sum.memberCount || 0),
      directTransactions: orders.length,
      produceTraded: Math.round(totalProduceKg),
      produceUnit: 'kg',
      farmerEarnings: Math.round(totalFarmerEarnings),
      consumerSpent: Math.round(totalConsumerSpent),
      avgFarmerRealization: krishisetuFarmerShare,
      traditionalFarmerShare,
      farmerRealizationImprovement: krishisetuFarmerShare - traditionalFarmerShare,
      consumerSavingsEstimate: Math.abs(consumerSavings),
      supplyChainLayersRemoved: 4,
      totalDeliveries: deliveries.length,
      completedDeliveries: completedDeliveries.length,
      avgDeliveryDistance: Math.round(avgFulfillmentDist * 10) / 10,
      logisticsEfficiency: completedDeliveries.length > 0 ? Math.round(completedDeliveries.length / deliveries.length * 100) : 0,
      // Traditional vs KrishiSetu breakdown (per ₹100 of consumer price)
      traditional: {
        farmerShare: 35,
        localTrader: 10,
        wholesaler: 15,
        distributor: 12,
        retailer: 20,
        logistics: 8
      },
      krishisetu: {
        farmerShare: krishisetuFarmerShare,
        platformFee: 5,
        logistics: 100 - krishisetuFarmerShare - 5
      },
      disclaimer: 'Prototype simulation based on platform transaction data. Traditional supply chain percentages are illustrative estimates.'
    });
  } catch (error: any) {
    console.error('Impact analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch impact analytics' });
  }
});

export default router;
