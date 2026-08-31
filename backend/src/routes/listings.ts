import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/listings
router.get('/', async (req, res) => {
  try {
    const { search, category, quality, organic, minPrice, maxPrice, location, sort, page = '1', limit = '50' } = req.query;

    const where: any = { status: 'ACTIVE' };

    if (search) {
      const q = String(search).toLowerCase();
      where.OR = [
        { product: { name: { contains: q } } },
        { location: { contains: q } },
        { farmer: { farmName: { contains: q } } },
        { farmer: { user: { name: { contains: q } } } },
        { fpo: { name: { contains: q } } }
      ];
    }

    if (category) {
      where.product = { ...where.product, category: String(category) };
    }

    if (quality) {
      where.quality = String(quality);
    }

    if (organic !== undefined && organic !== '') {
      where.organic = organic === 'true';
    }

    if (location) {
      where.location = { contains: String(location) };
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'price_asc') orderBy = { price: 'asc' };
    else if (sort === 'price_desc') orderBy = { price: 'desc' };
    else if (sort === 'freshest') orderBy = { harvestDate: 'desc' };

    const pageNum = parseInt(String(page), 10) || 1;
    const take = parseInt(String(limit), 10) || 50;
    const skip = (pageNum - 1) * take;

    const [listings, total] = await Promise.all([
      prisma.productListing.findMany({
        where,
        include: {
          product: true,
          farmer: { include: { user: { select: { id: true, name: true, phone: true, location: true } } } },
          fpo: { include: { user: { select: { id: true, name: true, phone: true, location: true } } } }
        },
        orderBy,
        skip,
        take
      }),
      prisma.productListing.count({ where })
    ]);

    res.json({
      listings,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / take)
    });
  } catch (error: any) {
    console.error('Listings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/listings/:id
router.get('/:id', async (req, res) => {
  try {
    const listing = await prisma.productListing.findUnique({
      where: { id: req.params.id },
      include: {
        product: true,
        farmer: { include: { user: { select: { id: true, name: true, phone: true, location: true } } } },
        fpo: { include: { user: { select: { id: true, name: true, phone: true, location: true } } } }
      }
    });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    res.json(listing);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/listings
router.post('/', authenticateToken, requireRole('FARMER', 'FPO'), async (req: AuthRequest, res: Response) => {
  try {
    const profile = await prisma.farmerProfile.findUnique({ where: { userId: req.user!.id } });
    const fpo = await prisma.fPO.findUnique({ where: { userId: req.user!.id } });
    
    if (!profile && !fpo) return res.status(403).json({ error: 'No farmer or FPO profile found' });

    const { productId, quantity, price, quality, harvestDate, location, organic, description } = req.body;

    const listing = await prisma.productListing.create({
      data: {
        productId,
        farmerId: profile?.id || null,
        fpoId: fpo?.id || null,
        quantity: Number(quantity),
        originalQty: Number(quantity),
        unit: 'kg',
        price: Number(price),
        quality: quality || 'Grade A',
        harvestDate: harvestDate ? new Date(harvestDate) : new Date(),
        location: location || profile?.farmLocation || fpo?.location || 'Indore',
        lat: profile?.lat || fpo?.lat || 22.7196,
        lng: profile?.lng || fpo?.lng || 75.8577,
        organic: Boolean(organic),
        description: description || null,
        status: 'ACTIVE'
      },
      include: {
        product: true,
        farmer: { include: { user: true } },
        fpo: { include: { user: true } }
      }
    });

    res.status(201).json(listing);
  } catch (error: any) {
    console.error('Create listing error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// PATCH /api/listings/:id
router.patch('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;
    if (data.quantity !== undefined) data.quantity = Number(data.quantity);
    if (data.price !== undefined) data.price = Number(data.price);
    if (data.harvestDate) data.harvestDate = new Date(data.harvestDate);

    const listing = await prisma.productListing.update({
      where: { id: req.params.id },
      data,
      include: { product: true }
    });
    res.json(listing);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/listings/:id
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.productListing.update({
      where: { id: req.params.id },
      data: { status: 'PAUSED' }
    });
    res.json({ success: true, message: 'Listing paused' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/listings/farmer/mine
router.get('/farmer/mine', authenticateToken, requireRole('FARMER', 'FPO'), async (req: AuthRequest, res: Response) => {
  try {
    const profile = await prisma.farmerProfile.findUnique({ where: { userId: req.user!.id } });
    const fpo = await prisma.fPO.findUnique({ where: { userId: req.user!.id } });
    
    const where: any = {};
    if (profile) where.farmerId = profile.id;
    else if (fpo) where.fpoId = fpo.id;
    else return res.json([]);

    const listings = await prisma.productListing.findMany({
      where,
      include: {
        product: true,
        orderItems: { include: { order: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(listings);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
