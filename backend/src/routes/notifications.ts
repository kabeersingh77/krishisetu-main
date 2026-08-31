import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/read-all', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id },
      data: { read: true }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
