import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { z } from 'zod';
import { User } from '@shared/schema';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Extend the Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
const SALT_ROUNDS = 12;

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['claimant', 'broker', 'adjudicator']).optional().default('claimant')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  twoFactorCode: z.string().optional()
});

const enable2FASchema = z.object({
  token: z.string().min(6).max(6)
});

// Types
interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  twoFactorEnabled: boolean;
}

// Hash password
async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

// Verify password
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Generate JWT token
function generateToken(user: User): string {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email || '', 
      role: user.role,
      firstName: user.firstName || '',
      lastName: user.lastName || ''
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Convert User to AuthUser for response
function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email || '',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    role: user.role,
    twoFactorEnabled: user.twoFactorEnabled || false
  };
}

// Verify JWT token
function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Authentication middleware
export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  // Get fresh user data
  const user = await storage.getUser(decoded.id);
  if (!user) {
    return res.status(401).json({ message: 'User not found' });
  }

  // Attach user to request in the same format as AuthUser
  (req as any).user = toAuthUser(user);
  next();
}

// Register endpoint
export async function register(req: Request, res: Response) {
  try {
    const validatedData = registerSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(validatedData.email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(validatedData.password);
    
    const user = await storage.createUser({
      email: validatedData.email,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      password: hashedPassword,
      role: validatedData.role,
      twoFactorEnabled: false,
      twoFactorSecret: null,
    });

    // Generate token

    res.status(201).json({
      message: 'User registered successfully',
      token: generateToken(user),
      user: toAuthUser(user)
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Login endpoint
export async function login(req: Request, res: Response) {
  try {
    const validatedData = loginSchema.parse(req.body);
    
    // Find user
    const user = await storage.getUserByEmail(validatedData.email);
    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await verifyPassword(validatedData.password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check 2FA if enabled
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      if (!validatedData.twoFactorCode) {
        return res.status(200).json({ 
          message: 'Two-factor authentication required',
          requiresTwoFactor: true 
        });
      }

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: validatedData.twoFactorCode,
        window: 2
      });

      if (!verified) {
        return res.status(401).json({ message: 'Invalid two-factor code' });
      }
    }

    res.json({
      message: 'Login successful',
      token: generateToken(user),
      user: toAuthUser(user)
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Setup 2FA endpoint
export async function setup2FA(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Motor Claims Platform (${user.email})`,
      issuer: 'Motor Claims Platform',
      length: 32
    });

    // Store temporary secret (not yet enabled)
    await storage.updateUser(user.id, {
      twoFactorSecret: secret.base32,
      twoFactorEnabled: false // Not enabled until verified
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Enable 2FA endpoint
export async function enable2FA(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const validatedData = enable2FASchema.parse(req.body);

    // Get user with secret
    const userWithSecret = await storage.getUser(user.id);
    if (!userWithSecret?.twoFactorSecret) {
      return res.status(400).json({ message: 'Two-factor setup not initiated' });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: userWithSecret.twoFactorSecret,
      encoding: 'base32',
      token: validatedData.token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Enable 2FA
    await storage.updateUser(user.id, {
      twoFactorEnabled: true
    });

    res.json({
      message: 'Two-factor authentication enabled successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('2FA enable error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Disable 2FA endpoint
export async function disable2FA(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await storage.updateUser(user.id, {
      twoFactorEnabled: false,
      twoFactorSecret: null
    });

    res.json({
      message: 'Two-factor authentication disabled successfully'
    });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Get current user endpoint
export async function getCurrentUser(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Logout endpoint (client-side token removal)
export async function logout(req: Request, res: Response) {
  res.json({ message: 'Logged out successfully' });
}