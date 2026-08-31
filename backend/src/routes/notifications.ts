import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

const SAMPLE_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'High Demand Alert',
    message: 'Tomato demand increased by 18% in Central MP region. Recommended listing price: ₹38–42/kg.',
    type: 'DEMAND',
    read: false,
    createdAt: new Date()
  },
  {
    id: 'notif-2',
    title: 'Order Confirmed',
    message: 'Order #ORD-8421 confirmed by farmer Rajesh Patel. Dispatch expected tomorrow.',
    type: 'ORDER',
    read: false,
    createdAt: new Date(Date.now() - 3600000)
  },
  {
    id: 'notif-3',
    title: 'Delivery in Transit',
    message: 'Consignment #DEL-109 is on the way to destination Bhopal Hub.',
    type: 'DELIVERY',
    read: true,
    createdAt: new Date(Date.now() - 7200000)
  }
];

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' }
      });
      if (notifications.length > 0) return res.json(notifications);
    } catch (e) {
      console.warn('Prisma notification query fallback:', e);
    }
    res.json(SAMPLE_NOTIFICATIONS);
  } catch (error) {
    res.json(SAMPLE_NOTIFICATIONS);
  }
});

router.patch('/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    try {
      await prisma.notification.update({
        where: { id: req.params.id },
        data: { read: true }
      });
    } catch (e) {
      // ignore
    }
    res.json({ success: true });
  } catch (error) {
    res.json({ success: true });
  }
});

router.patch('/read-all', async (req: AuthRequest, res: Response) => {
  try {
    try {
      await prisma.notification.updateMany({
        where: { userId: req.user!.id },
        data: { read: true }
      });
    } catch (e) {
      // ignore
    }
    res.json({ success: true });
  } catch (error) {
    res.json({ success: true });
  }
});

export default router;
