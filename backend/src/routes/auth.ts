import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['FARMER', 'FPO', 'CONSUMER', 'BULK_BUYER', 'LOGISTICS', 'ADMIN']),
  phone: z.string().optional(),
  location: z.string().optional(),
  farmName: z.string().optional(),
  farmLocation: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional()
});

router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return res.status(400).json({ error: 'Email in use' });

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role,
        phone: data.phone,
        location: data.location,
        cart: { create: {} }
      }
    });

    if (data.role === 'FARMER' && data.farmName && data.farmLocation && data.lat && data.lng) {
      await prisma.farmerProfile.create({
        data: {
          userId: user.id,
          farmName: data.farmName,
          farmLocation: data.farmLocation,
          lat: data.lat,
          lng: data.lng
        }
      });
    }

    if (data.role === 'FPO' && data.farmName && data.farmLocation && data.lat && data.lng) {
        await prisma.fPO.create({
            data: {
                userId: user.id,
                name: data.farmName,
                location: data.farmLocation,
                lat: data.lat,
                lng: data.lng
            }
        });
    }

    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    const { passwordHash: _, ...userWithoutPass } = user;
    res.json({ token, user: userWithoutPass });
  } catch (error) {
    if (error instanceof z.ZodError) res.status(400).json({ error: error.errors });
    else res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    const { passwordHash: _, ...userWithoutPass } = user;
    res.json({ token, user: userWithoutPass });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { farmerProfile: true, fpo: true }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { passwordHash, ...userWithoutPass } = user;
    res.json(userWithoutPass);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
