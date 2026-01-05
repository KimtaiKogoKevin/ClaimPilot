import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { z } from 'zod';
import { User, forgotPasswordSchema, resetPasswordSchema } from '@shared/schema';
import { emailService } from './emailService';

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
  confirmPassword: z.string().min(8).optional(), // Make optional for server processing
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['insured', 'admin']).optional().default('insured')
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  twoFactorCode: z.string().optional()
});

const enable2FASchema = z.object({
  token: z.string().min(6).max(6)
});

// Admin signup request validation schema
export const adminSignupRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  companyName: z.string().min(1),
  companyType: z.enum(['insurance_company', 'broker', 'other']),
  businessRegistrationNumber: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  reason: z.string().optional()
});

// Insured registration schema (simplified, forces insured role)
const insuredRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8).optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1)
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
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    // Debug logging for view details requests
    if (req.path.includes('/claims/') && req.method === 'GET') {
      console.log(`🔍 AUTH DEBUG for ${req.path}:`, {
        hasAuthHeader: !!authHeader,
        authHeaderStart: authHeader?.substring(0, 20) + '...',
        hasToken: !!token,
        tokenStart: token?.substring(0, 10) + '...',
        jwtSecretExists: !!process.env.JWT_SECRET,
        path: req.path,
        method: req.method
      });
    }

    if (!token) {
      console.log('❌ No token provided for', req.path);
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      console.log('❌ Token verification failed for', req.path);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Get fresh user data
    const user = await storage.getUser(decoded.id);
    if (!user) {
      console.log('❌ User not found in database:', decoded.id, 'for path:', req.path);
      return res.status(401).json({ message: 'User not found' });
    }

    // Debug success
    if (req.path.includes('/claims/') && req.method === 'GET') {
      console.log('✅ Authentication successful for:', user.email, 'accessing', req.path);
    }

    // Attach user to request - ensure consistent structure
    const authUser = toAuthUser(user);
    (req as any).user = authUser;
    
    // Also set individual properties for compatibility
    (req as any).userId = authUser.id;
    
    next();
  } catch (error) {
    console.error("❌ Authentication error for", req.path, ":", error);
    return res.status(401).json({ message: 'Authentication failed' });
  }
}

// Register endpoint
export async function register(req: Request, res: Response) {
  try {
    // Log the incoming request for debugging
    console.log('Registration request body:', JSON.stringify(req.body, null, 2));
    
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
      console.error('Validation error:', error.errors);
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Registration error details:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
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

// Forgot password endpoint
export async function forgotPassword(req: Request, res: Response) {
  try {
    const validatedData = forgotPasswordSchema.parse(req.body);
    
    // Check if user exists
    const user = await storage.getUserByEmail(validatedData.email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    // Generate reset token (32 bytes = 64 character hex string)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

    // Save token to database
    await storage.setPasswordResetToken(validatedData.email, resetToken, resetExpires);

    // Generate reset URL
    const resetUrl = `${req.protocol}://${req.get('host')}/auth?reset=${resetToken}`;
    
    // Try to send email
    let emailSent = false;
    if (emailService.isReady()) {
      emailSent = await emailService.sendPasswordResetEmail(validatedData.email, resetUrl);
    }
    
    // Log for development (remove in production)
    if (!emailSent) {
      console.log('Email service not configured. Password reset URL:', resetUrl);
    }

    res.json({ 
      message: emailSent 
        ? 'If an account with that email exists, a password reset link has been sent to your email.'
        : 'If an account with that email exists, a password reset link has been sent.',
      // In development only - remove in production
      ...(process.env.NODE_ENV === 'development' && !emailSent && { resetUrl })
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Reset password endpoint
export async function resetPassword(req: Request, res: Response) {
  try {
    const validatedData = resetPasswordSchema.parse(req.body);
    
    // Find user by reset token
    const user = await storage.getUserByPasswordResetToken(validatedData.token);
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const hashedPassword = await hashPassword(validatedData.password);
    
    // Update password and clear reset token
    await storage.updateUser(user.id, {
      password: hashedPassword
    });
    await storage.clearPasswordResetToken(user.id);

    res.json({ message: 'Password has been successfully reset. You can now log in with your new password.' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Register insured user - immediate registration with forced 'insured' role
export async function registerInsured(req: Request, res: Response) {
  try {
    console.log('Insured registration request body:', JSON.stringify(req.body, null, 2));
    
    const validatedData = insuredRegisterSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(validatedData.email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password and create user with forced 'insured' role
    const hashedPassword = await hashPassword(validatedData.password);
    
    const user = await storage.createUser({
      email: validatedData.email,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      password: hashedPassword,
      role: 'insured',
      twoFactorEnabled: false,
      twoFactorSecret: null,
    });

    res.status(201).json({
      message: 'User registered successfully',
      token: generateToken(user),
      user: toAuthUser(user)
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Insured registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Register admin request - creates pending request for admin approval
export async function registerAdminRequest(req: Request, res: Response) {
  try {
    console.log('Admin signup request body:', JSON.stringify(req.body, null, 2));
    
    const validatedData = adminSignupRequestSchema.parse(req.body);
    
    // Check if email is already registered as user
    const existingUser = await storage.getUserByEmail(validatedData.email);
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    // Check if there's already a pending request for this email
    const existingRequest = await storage.getAdminSignupRequestByEmail(validatedData.email);
    if (existingRequest && existingRequest.status === 'pending') {
      return res.status(400).json({ message: 'A signup request with this email is already pending approval' });
    }

    // Hash the password before storing
    const hashedPassword = await hashPassword(validatedData.password);

    // Create admin signup request
    await storage.createAdminSignupRequest({
      email: validatedData.email,
      password: hashedPassword,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      companyName: validatedData.companyName,
      companyType: validatedData.companyType,
      businessRegistrationNumber: validatedData.businessRegistrationNumber || null,
      phoneNumber: validatedData.phoneNumber || null,
      address: validatedData.address || null,
      reason: validatedData.reason || null,
    });

    res.status(201).json({
      message: 'Your admin signup request has been submitted and is pending approval. You will be notified once your request is reviewed.'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Admin signup request error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Get admin signup requests - admin only
export async function getAdminSignupRequests(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Only admins can view signup requests
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    // Get optional status filter from query params
    const status = req.query.status as string | undefined;
    
    const requests = await storage.getAdminSignupRequests(status);
    
    // Remove password hashes from response for security
    const sanitizedRequests = requests.map(r => {
      const { password, ...rest } = r;
      return rest;
    });

    res.json(sanitizedRequests);
  } catch (error) {
    console.error('Get admin signup requests error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Approve admin signup request - admin only
export async function approveAdminSignupRequest(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Only admins can approve requests
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    const { id } = req.params;
    
    // Get the request by ID
    const signupRequest = await storage.getAdminSignupRequestById(id);
    if (!signupRequest) {
      return res.status(404).json({ message: 'Admin signup request not found' });
    }

    if (signupRequest.status !== 'pending') {
      return res.status(400).json({ message: `Request has already been ${signupRequest.status}` });
    }

    // Check if email is now taken (user might have registered during pending period)
    const existingUser = await storage.getUserByEmail(signupRequest.email);
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email has already been created' });
    }

    // Create new user from the request details with role='admin'
    const newUser = await storage.createUser({
      email: signupRequest.email,
      firstName: signupRequest.firstName,
      lastName: signupRequest.lastName,
      password: signupRequest.password, // Already hashed
      role: 'admin',
      twoFactorEnabled: false,
      twoFactorSecret: null,
    });

    // Mark the request as approved
    await storage.approveAdminSignupRequest(id, user.id);

    res.json({
      message: 'Admin signup request approved successfully',
      user: toAuthUser(newUser)
    });
  } catch (error) {
    console.error('Approve admin signup request error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Reject admin signup request - admin only
export async function rejectAdminSignupRequest(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Only admins can reject requests
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    const { id } = req.params;
    const { reason } = req.body;
    
    // Get the request by ID
    const signupRequest = await storage.getAdminSignupRequestById(id);
    if (!signupRequest) {
      return res.status(404).json({ message: 'Admin signup request not found' });
    }

    if (signupRequest.status !== 'pending') {
      return res.status(400).json({ message: `Request has already been ${signupRequest.status}` });
    }

    // Mark the request as rejected
    await storage.rejectAdminSignupRequest(id, user.id, reason || 'No reason provided');

    res.json({
      message: 'Admin signup request rejected successfully'
    });
  } catch (error) {
    console.error('Reject admin signup request error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}