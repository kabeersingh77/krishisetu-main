import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { getPriceRecommendation } from '../services/pricingEngine.js';
import { getDemandForecast } from '../services/demandForecast.js';
import { getConsumerRecommendations, getFarmerRecommendations } from '../services/recommendationEngine.js';
import { prisma } from '../lib/prisma.js';

const router = Router();
router.use(authenticateToken);

// POST /api/ai/price-recommendation
router.post('/price-recommendation', async (req: AuthRequest, res: Response) => {
  try {
    const { crop, quantity, location, quality, harvestDate } = req.body;
    if (!crop) {
      return res.status(400).json({ error: 'Crop name is required' });
    }
    const rec = await getPriceRecommendation(
      crop,
      Number(quantity) || 100,
      location || 'Indore',
      quality || 'Grade A',
      harvestDate ? new Date(harvestDate) : new Date()
    );
    res.json(rec);
  } catch (error: any) {
    console.error('Price recommendation error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// GET /api/ai/demand-forecast
router.get('/demand-forecast', async (req: AuthRequest, res: Response) => {
  try {
    const { crop, location, period } = req.query;
    if (!crop) {
      return res.status(400).json({ error: 'Crop name is required' });
    }
    const forecast = await getDemandForecast(
      String(crop),
      location ? String(location) : '',
      Number(period) || 7
    );
    res.json(forecast);
  } catch (error: any) {
    console.error('Demand forecast error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// GET /api/ai/price-history
router.get('/price-history', async (req: AuthRequest, res: Response) => {
  try {
    const { crop, location } = req.query;
    if (!crop) {
      return res.status(400).json({ error: 'Crop name is required' });
    }

    const product = await prisma.product.findFirst({
      where: { name: { contains: String(crop) } }
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const where: any = { productId: product.id };
    if (location) {
      where.location = String(location);
    }

    const history = await prisma.marketPrice.findMany({
      where,
      orderBy: { date: 'asc' },
      take: 60
    });

    res.json(history);
  } catch (error: any) {
    console.error('Price history error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/ai/recommendations
router.get('/recommendations', async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user!.role;
    if (userRole === 'FARMER' || userRole === 'FPO') {
      const farmerRecs = await getFarmerRecommendations(req.user!.id);
      return res.json(farmerRecs);
    } else {
      const consumerRecs = await getConsumerRecommendations(req.user!.id);
      return res.json(consumerRecs);
    }
  } catch (error: any) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/ai/farmer-alerts
router.get('/farmer-alerts', async (req: AuthRequest, res: Response) => {
  try {
    const farmerRecs = await getFarmerRecommendations(req.user!.id);
    const alerts: Array<{ id: string; type: 'DEMAND' | 'PRICE' | 'OPPORTUNITY'; title: string; message: string; date: Date }> = [];
    
    if (farmerRecs.crops && farmerRecs.crops.length > 0) {
      farmerRecs.crops.forEach((c, idx) => {
        if (c.demandTrend === 'RISING') {
          alerts.push({
            id: `alert-${idx}`,
            type: 'DEMAND',
            title: `Rising Demand for ${c.crop}`,
            message: c.recommendation,
            date: new Date()
          });
        }
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        id: 'alert-default',
        type: 'OPPORTUNITY',
        title: 'Optimal Listing Window',
        message: 'High buyer activity observed during morning hours (8 AM - 12 PM).',
        date: new Date()
      });
    }

    res.json(alerts);
  } catch (error: any) {
    console.error('Farmer alerts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
