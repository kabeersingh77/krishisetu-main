import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user!.id },
      include: {
        items: {
          include: { listing: { include: { product: true } } }
        }
      }
    });
    res.json(cart || { items: [] });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/items', requireRole('CONSUMER', 'BULK_BUYER'), async (req: AuthRequest, res: Response) => {
  try {
    const { listingId, quantity } = req.body;
    let cart = await prisma.cart.findUnique({ where: { userId: req.user!.id } });
    if (!cart) cart = await prisma.cart.create({ data: { userId: req.user!.id } });

    const item = await prisma.cartItem.upsert({
      where: { cartId_listingId: { cartId: cart.id, listingId } },
      update: { quantity: { increment: quantity } },
      create: { cartId: cart.id, listingId, quantity }
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/items/:id', async (req: AuthRequest, res: Response) => {
  try {
    const item = await prisma.cartItem.update({
      where: { id: req.params.id },
      data: { quantity: req.body.quantity }
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/items/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.cartItem.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/clear', async (req: AuthRequest, res: Response) => {
  try {
    const cart = await prisma.cart.findUnique({ where: { userId: req.user!.id } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
