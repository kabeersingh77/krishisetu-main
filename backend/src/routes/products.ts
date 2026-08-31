import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;
    
    let whereClause: any = {};
    if (category) {
      whereClause.category = String(category);
    }
    if (search) {
      whereClause.name = { contains: String(search) };
    }

    const products = await prisma.product.findMany({
      where: whereClause
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: { listings: { where: { status: 'ACTIVE' } } }
        }
      }
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
