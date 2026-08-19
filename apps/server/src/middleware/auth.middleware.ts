import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../utils/errors.js';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      walletAddress?: string;
    }
  }
}

const sessions = new Map<string, { userId: string; walletAddress: string; expiresAt: Date }>();

export const sessionStore = {
  create: (token: string, userId: string, walletAddress: string, expiresInMs: number = 24 * 60 * 60 * 1000) => {
    sessions.set(token, {
      userId,
      walletAddress,
      expiresAt: new Date(Date.now() + expiresInMs),
    });
  },

  get: (token: string) => {
    const session = sessions.get(token);
    if (!session) return null;
    
    if (session.expiresAt < new Date()) {
      sessions.delete(token);
      return null;
    }
    
    return session;
  },

  delete: (token: string) => {
    sessions.delete(token);
  },

  cleanup: () => {
    const now = new Date();
    for (const [token, session] of sessions) {
      if (session.expiresAt < now) {
        sessions.delete(token);
      }
    }
  },
};

export function generateNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let nonce = '';
  for (let i = 0; i < 32; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('No authorization token provided'));
  }

  const token = authHeader.slice(7);
  const session = sessionStore.get(token);

  if (!session) {
    return next(new UnauthorizedError('Invalid or expired session'));
  }

  req.userId = session.userId;
  req.walletAddress = session.walletAddress;
  
  next();
}
