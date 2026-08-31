import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const saved = await prisma.savedProduct.findMany({
      where: { userId: req.user!.id },
      include: { listing: { include: { product: true } } }
    });
    res.json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:listingId', async (req: AuthRequest, res: Response) => {
  try {
    const saved = await prisma.savedProduct.create({
      data: {
        userId: req.user!.id,
        listingId: req.params.listingId
      }
    });
    res.json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:listingId', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.savedProduct.delete({
      where: {
        userId_listingId: {
          userId: req.user!.id,
          listingId: req.params.listingId
        }
      }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
