import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

const FALLBACK_PRODUCTS = [
  { id: 'p-tomato', name: 'Tomato', category: 'Vegetable', variety: 'Roma', unit: 'kg' },
  { id: 'p-potato', name: 'Potato', category: 'Vegetable', variety: 'Kufri Jyoti', unit: 'kg' },
  { id: 'p-onion', name: 'Onion', category: 'Vegetable', variety: 'Nasik Red', unit: 'kg' },
  { id: 'p-wheat', name: 'Wheat', category: 'Grain', variety: 'Sharbati', unit: 'kg' },
  { id: 'p-soybean', name: 'Soybean', category: 'Grain', variety: 'Yellow JS-335', unit: 'kg' },
  { id: 'p-rice', name: 'Rice', category: 'Grain', variety: 'Basmati', unit: 'kg' },
  { id: 'p-chilli', name: 'Chilli', category: 'Spice', variety: 'Guntur', unit: 'kg' },
  { id: 'p-cauliflower', name: 'Cauliflower', category: 'Vegetable', variety: 'Snowball', unit: 'kg' },
  { id: 'p-cabbage', name: 'Cabbage', category: 'Vegetable', variety: 'Golden Acre', unit: 'kg' },
  { id: 'p-mango', name: 'Mango', category: 'Fruit', variety: 'Alphonso', unit: 'kg' },
];

router.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;

    let whereClause: any = {};
    if (category) whereClause.category = String(category);
    if (search) whereClause.name = { contains: String(search) };

    const products = await prisma.product.findMany({ where: whereClause });
    if (products.length > 0) return res.json(products);
    return res.json(FALLBACK_PRODUCTS);
  } catch (error) {
    console.warn('Prisma products query fallback:', error);
    res.json(FALLBACK_PRODUCTS);
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
    if (product) return res.json(product);
    const fallback = FALLBACK_PRODUCTS.find(p => p.id === req.params.id || p.name.toLowerCase() === req.params.id.toLowerCase());
    if (fallback) return res.json(fallback);
    return res.status(404).json({ error: 'Product not found' });
  } catch (error) {
    const fallback = FALLBACK_PRODUCTS.find(p => p.id === req.params.id || p.name.toLowerCase() === req.params.id.toLowerCase());
    if (fallback) return res.json(fallback);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
