import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth.js';
import { optimizeRoute } from '../services/routeOptimizer.js';

const router = Router();
router.use(authenticateToken);

// GET /api/logistics/deliveries
router.get('/deliveries', async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { farmerProfile: true, fpo: true }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    let where: any = {};
    if (user.role === 'LOGISTICS' || user.role === 'ADMIN') {
      // All deliveries
    } else if (user.role === 'CONSUMER' || user.role === 'BULK_BUYER') {
      where = { order: { buyerId: user.id } };
    } else if (user.role === 'FARMER' || user.role === 'FPO') {
      const profileId = user.farmerProfile?.id;
      const fpoId = user.fpo?.id;
      where = {
        order: {
          items: {
            some: {
              listing: {
                OR: [
                  ...(profileId ? [{ farmerId: profileId }] : []),
                  ...(fpoId ? [{ fpoId: fpoId }] : [])
                ]
              }
            }
          }
        }
      };
    }

    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        order: {
          include: {
            buyer: { select: { id: true, name: true, phone: true, email: true, location: true } },
            items: {
              include: {
                listing: {
                  include: {
                    product: true,
                    farmer: { include: { user: { select: { name: true, phone: true } } } },
                    fpo: { include: { user: { select: { name: true, phone: true } } } }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(deliveries);
  } catch (error) {
    console.error('Deliveries error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/logistics/deliveries/:id/status
router.patch('/deliveries/:id/status', requireRole('LOGISTICS', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { status, driver, vehicle } = req.body;
    const updateData: any = { status };
    if (driver) updateData.driver = driver;
    if (vehicle) updateData.vehicle = vehicle;
    if (status === 'DELIVERED') updateData.completedAt = new Date();

    const delivery = await prisma.delivery.update({
      where: { id: req.params.id },
      data: updateData,
      include: { order: true }
    });

    // Also update order status if delivered or in transit
    const orderStatusMap: Record<string, string> = {
      'PICKED_UP': 'PROCESSING',
      'IN_TRANSIT': 'SHIPPED',
      'DELIVERED': 'DELIVERED'
    };

    if (orderStatusMap[status]) {
      await prisma.order.update({
        where: { id: delivery.orderId },
        data: { status: orderStatusMap[status] }
      });
    }

    // Notify buyer
    await prisma.notification.create({
      data: {
        userId: delivery.order.buyerId,
        title: `Delivery ${status.replace('_', ' ')}`,
        message: `Your delivery from ${delivery.origin} to ${delivery.destination} is now ${status.replace('_', ' ').toLowerCase()}.`,
        type: 'DELIVERY',
        link: '/consumer/orders'
      }
    });

    res.json(delivery);
  } catch (error) {
    console.error('Update delivery error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/logistics/optimize-route
router.post('/optimize-route', async (req: AuthRequest, res: Response) => {
  try {
    const { origin, destinations, vehicleCapacity } = req.body;
    if (!origin || !destinations || !Array.isArray(destinations)) {
      return res.status(400).json({ error: 'Origin and destinations array are required' });
    }

    const result = optimizeRoute(origin, destinations, vehicleCapacity || 1000);
    res.json(result);
  } catch (error: any) {
    console.error('Optimize route error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

export default router;
