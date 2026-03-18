import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';

const prisma = new PrismaClient();

export interface JwtPayload {
  userId: number;
  role: string;
  impersonatedBy?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role: string;
        impersonatedBy?: number;
      };
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, status: true },
    });

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    if (user.status === 'BANNED') {
      res.status(403).json({ error: 'Your account has been suspended. Please contact the administrator.' });
      return;
    }

    if (user.status === 'DELETED') {
      res.status(401).json({ error: 'Account has been deleted' });
      return;
    }

    req.user = {
      id: decoded.userId,
      role: decoded.role,
      impersonatedBy: decoded.impersonatedBy,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // During impersonation, allow admin routes if the impersonator was an admin
    if (req.user.impersonatedBy && roles.includes('SYSADMIN')) {
      next();
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};
