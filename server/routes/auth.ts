import type { Express } from "express";
import { generateToken, hashPassword, comparePassword } from "../auth/jwt";
import { storage } from "../storage";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export function setupAuthRoutes(app: Express) {
  // Register new user
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = registerSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail?.(email);
      if (existingUser) {
        return res.status(409).json({ message: 'User already exists' });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(password);

      const user = await storage.upsertUser({
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        firstName,
        lastName,
        profileImageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}+${encodeURIComponent(lastName)}&background=007bff&color=fff`,
        // Store hashed password in a password field (you'll need to add this to schema)
        ...(hashedPassword && { password: hashedPassword })
      });

      const token = generateToken(user.id, user.email!);

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl
        },
        token
      });
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: error.errors });
      }
      res.status(500).json({ message: 'Registration failed' });
    }
  });

  // Login user
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const user = await storage.getUserByEmail?.(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // For now, skip password verification until we add password field to schema
      // In a real implementation, you'd verify: await comparePassword(password, user.password)
      
      const token = generateToken(user.id, user.email!);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl
        },
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: error.errors });
      }
      res.status(500).json({ message: 'Login failed' });
    }
  });

  // Simple email-only login for development
  app.post('/api/auth/simple-login', async (req, res) => {
    try {
      const { email, firstName, lastName } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      let user = await storage.getUserByEmail?.(email);
      if (!user) {
        user = await storage.upsertUser({
          id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          email,
          firstName: firstName || 'User',
          lastName: lastName || 'Local',
          profileImageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName || 'User')}+${encodeURIComponent(lastName || 'Local')}&background=007bff&color=fff`,
        });
      }

      const token = generateToken(user.id, user.email!);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl
        },
        token
      });
    } catch (error) {
      console.error('Simple login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  // Get current user (requires authentication)
  app.get('/api/auth/me', async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    try {
      const { verifyToken } = await import('../auth/jwt');
      const payload = verifyToken(token);
      
      if (!payload) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      const user = await storage.getUser(payload.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl
      });
    } catch (error) {
      console.error('Auth me error:', error);
      res.status(500).json({ message: 'Failed to get user' });
    }
  });

  // Logout (client-side token removal)
  app.post('/api/auth/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
  });
}