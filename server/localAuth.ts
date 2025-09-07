import type { Express, RequestHandler } from "express";
import session from "express-session";
import { storage } from "./storage";

// Simple session configuration for local development
export function getLocalSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  return session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to false for local HTTP
      maxAge: sessionTtl,
    },
  });
}

// Simple authentication middleware for local development
export const isLocallyAuthenticated: RequestHandler = (req, res, next) => {
  if (req.session && (req.session as any).user) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

export async function setupLocalAuth(app: Express) {
  app.use(getLocalSession());

  // Simple email-based login for local development
  app.post('/api/auth/local-login', async (req, res) => {
    const { email, firstName, lastName } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    try {
      // Create or get user
      let user = await storage.getUserByEmail?.(email);
      if (!user) {
        user = await storage.upsertUser({
          id: `local-${Date.now()}`,
          email,
          firstName: firstName || 'Test',
          lastName: lastName || 'User',
          profileImageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName || 'Test')}+${encodeURIComponent(lastName || 'User')}&background=007bff&color=fff`,
        });
      }

      // Set session
      (req.session as any).user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
      };

      res.json({ success: true, user });
    } catch (error) {
      console.error("Local login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  // Get current user endpoint
  app.get('/api/auth/user', isLocallyAuthenticated, async (req, res) => {
    try {
      const sessionUser = (req.session as any).user;
      const user = await storage.getUser(sessionUser.id);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}