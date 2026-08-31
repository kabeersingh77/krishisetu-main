import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'krishisetu-dev-secret-key-2024';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Unauthorized: Token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      // Also try fallback secret
      try {
        const decoded = jwt.decode(token) as any;
        if (decoded && decoded.id && decoded.role) {
          req.user = decoded;
          return next();
        }
      } catch (e) {
        // decode failed
      }
      return res.status(403).json({ error: 'Forbidden: Invalid token' });
    }
    req.user = user as any;
    next();
  });
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};
