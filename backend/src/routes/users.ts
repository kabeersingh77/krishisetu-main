import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

router.get('/', requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, name: true, email: true, role: true, createdAt: true,
        farmerProfile: true, fpo: true
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id/verify', requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id }, include: { farmerProfile: true, fpo: true } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.farmerProfile) {
      await prisma.farmerProfile.update({ where: { id: user.farmerProfile.id }, data: { verified: true } });
    }
    if (user.fpo) {
      await prisma.fPO.update({ where: { id: user.fpo.id }, data: { verified: true } });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
