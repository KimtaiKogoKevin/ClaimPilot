#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Claims Platform for Local Development\n');

// Check if .env exists
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file...');
  const envTemplate = `# Database Configuration
DATABASE_URL=postgresql://claims_user:your_password_here@localhost:5432/claims_db
PGHOST=localhost
PGPORT=5432
PGUSER=claims_user
PGPASSWORD=your_password_here
PGDATABASE=claims_db

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-minimum-32-characters-long

# Google Cloud Storage (replace with your values)
GOOGLE_APPLICATION_CREDENTIALS=./gcp-service-account.json
DEFAULT_OBJECT_STORAGE_BUCKET_ID=your-claims-bucket
PRIVATE_OBJECT_DIR=/your-claims-bucket/private
PUBLIC_OBJECT_SEARCH_PATHS=/your-claims-bucket/public

# Roboflow AI Configuration (replace with your values)
ROBOFLOW_API_KEY=your-roboflow-api-key
ROBOFLOW_VEHICLE_MODEL=your-vehicle-damage-model-endpoint
ROBOFLOW_GOODS_MODEL=your-goods-damage-model-endpoint

# Local Development
NODE_ENV=development
PORT=5000
USE_LOCAL_AUTH=true
`;
  
  fs.writeFileSync(envPath, envTemplate);
  console.log('✅ Created .env file - please update with your values\n');
} else {
  console.log('✅ .env file already exists\n');
}

// Create local authentication route file
const localAuthRoute = path.join(__dirname, '..', 'server', 'routes-local.ts');
if (!fs.existsSync(localAuthRoute)) {
  console.log('📝 Creating local authentication routes...');
  const routeContent = `import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupLocalAuth, isLocallyAuthenticated } from "./localAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup local authentication instead of Replit Auth
  await setupLocalAuth(app);

  // Protected routes using local auth
  app.get('/api/auth/user', isLocallyAuthenticated, async (req: any, res) => {
    try {
      const sessionUser = req.session.user;
      const user = await storage.getUser(sessionUser.id);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Claims routes (protected)
  app.post("/api/claims", isLocallyAuthenticated, async (req, res) => {
    try {
      const userId = req.session.user.id;
      const claim = await storage.createClaim({
        ...req.body,
        claimantId: userId,
      });
      res.json(claim);
    } catch (error) {
      console.error("Error creating claim:", error);
      res.status(500).json({ message: "Failed to create claim" });
    }
  });

  app.get("/api/claims", isLocallyAuthenticated, async (req, res) => {
    try {
      const userId = req.session.user.id;
      const claims = await storage.getClaimsByUser(userId);
      res.json(claims);
    } catch (error) {
      console.error("Error fetching claims:", error);
      res.status(500).json({ message: "Failed to fetch claims" });
    }
  });

  // Add other routes as needed...
  // For a complete setup, copy routes from the original routes.ts
  // and replace isAuthenticated with isLocallyAuthenticated

  const httpServer = createServer(app);
  return httpServer;
}
`;
  
  fs.writeFileSync(localAuthRoute, routeContent);
  console.log('✅ Created local authentication routes\n');
}

// Create local version of main server file
const localIndexPath = path.join(__dirname, '..', 'server', 'index-local.ts');
if (!fs.existsSync(localIndexPath)) {
  console.log('📝 Creating local server configuration...');
  const indexContent = `import express from "express";
import { registerRoutes } from "./routes-local";
import { setupVite } from "./vite";

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup routes with local authentication
registerRoutes(app).then((server) => {
  // Setup Vite for frontend
  setupVite(app, server);
  
  server.listen(port, "0.0.0.0", () => {
    console.log(\`🚀 Server running on port \${port}\`);
    console.log(\`📱 Frontend: http://localhost:\${port}\`);
    console.log(\`🔧 API: http://localhost:\${port}/api\`);
  });
});
`;
  
  fs.writeFileSync(localIndexPath, indexContent);
  console.log('✅ Created local server configuration\n');
}

// Create local package.json script
const packagePath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packagePath)) {
  const package = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  if (!package.scripts['dev:local']) {
    package.scripts['dev:local'] = 'NODE_ENV=development tsx server/index-local.ts';
    fs.writeFileSync(packagePath, JSON.stringify(package, null, 2));
    console.log('✅ Added dev:local script to package.json\n');
  }
}

console.log('🎉 Local development setup complete!\n');
console.log('Next steps:');
console.log('1. Update .env file with your database and API credentials');
console.log('2. Set up PostgreSQL database: npm run db:push');
console.log('3. Start development server: npm run dev:local');
console.log('\nSee LOCAL_SETUP.md for detailed instructions.');