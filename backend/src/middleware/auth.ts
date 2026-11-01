import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt';

export type AuthedRequest = Request & {
  userId?: string;
};

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'missing or malformed authorization header' });
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    return next();
  } catch {
    return res.status(401).json({ error: 'invalid or expired token' });
  }
}