import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { RequestHandler } from 'express';
import { storage } from '../storage';

interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export function generateToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export const authenticateToken: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }

  try {
    const user = await storage.getUser(payload.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    (req as any).user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
};

// Alternative session-based auth for simpler setup
export const authenticateSession: RequestHandler = async (req, res, next) => {
  if (!req.session || !(req.session as any).userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const user = await storage.getUser((req.session as any).userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    (req as any).user = user;
    next();
  } catch (error) {
    console.error('Session authentication error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
};