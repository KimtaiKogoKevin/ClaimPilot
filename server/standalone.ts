import express from "express";
import cors from "cors";
import path from "path";
import { fileStorage, initializeDirectories, uploadConfig } from "./storage/fileSystem";
import { setupAuthRoutes } from "./routes/auth";
import { authenticateToken } from "./auth/jwt";
import { storage } from "./storage";
import { z } from "zod";

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Initialize file system
initializeDirectories().catch(console.error);

// Authentication routes (no auth required)
setupAuthRoutes(app);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// File upload endpoints (requires authentication)
app.post('/api/upload/photo', authenticateToken, uploadConfig.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const category = req.body.category || 'photos';
    const subCategory = req.body.subCategory || 'vehicle';
    const relativePath = await fileStorage.saveFile(req.file, category, subCategory);
    const publicUrl = fileStorage.getPublicUrl(relativePath);

    res.json({
      message: 'File uploaded successfully',
      path: relativePath,
      url: publicUrl,
      filename: req.file.filename,
      size: req.file.size
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed' });
  }
});

// Claims endpoints (requires authentication)
app.post('/api/claims', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const claimData = {
      ...req.body,
      claimantId: user.id,
    };

    const claim = await storage.createClaim(claimData);
    res.status(201).json(claim);
  } catch (error) {
    console.error('Create claim error:', error);
    res.status(500).json({ message: 'Failed to create claim' });
  }
});

app.get('/api/claims', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const claims = await storage.getClaimsByUser(user.id);
    res.json(claims);
  } catch (error) {
    console.error('Fetch claims error:', error);
    res.status(500).json({ message: 'Failed to fetch claims' });
  }
});

app.get('/api/claims/:id', authenticateToken, async (req, res) => {
  try {
    const claim = await storage.getClaim(req.params.id);
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    // Check if user owns this claim or is staff
    const user = (req as any).user;
    if (claim.claimantId !== user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(claim);
  } catch (error) {
    console.error('Fetch claim error:', error);
    res.status(500).json({ message: 'Failed to fetch claim' });
  }
});

app.put('/api/claims/:id', authenticateToken, async (req, res) => {
  try {
    const claim = await storage.getClaim(req.params.id);
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    const user = (req as any).user;
    if (claim.claimantId !== user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedClaim = await storage.updateClaim(req.params.id, req.body);
    res.json(updatedClaim);
  } catch (error) {
    console.error('Update claim error:', error);
    res.status(500).json({ message: 'Failed to update claim' });
  }
});

// AI Analysis endpoint (optional - can be disabled)
app.post('/api/analyze-damage', authenticateToken, async (req, res) => {
  const enableAI = process.env.ENABLE_AI_ANALYSIS === 'true';
  
  if (!enableAI) {
    return res.json({
      message: 'AI analysis is disabled. Enable by setting ENABLE_AI_ANALYSIS=true',
      analysis: null
    });
  }

  try {
    const { imageUrl, damageType } = req.body;
    
    // Here you would integrate with Roboflow or your AI service
    // For now, return a mock response
    const mockAnalysis = {
      confidence: 0.85,
      detectedDamages: [
        {
          type: 'dent',
          severity: 'moderate',
          confidence: 0.85,
          boundingBox: { x: 100, y: 100, width: 200, height: 150 }
        }
      ],
      estimatedCost: 1500
    };

    res.json({ analysis: mockAnalysis });
  } catch (error) {
    console.error('AI analysis error:', error);
    res.status(500).json({ message: 'Analysis failed' });
  }
});

// Staff endpoints (you can add role-based auth later)
app.get('/api/staff/claims', authenticateToken, async (req, res) => {
  try {
    // In a real app, check if user has staff role
    const claims = await storage.getAllClaims();
    res.json(claims);
  } catch (error) {
    console.error('Staff fetch claims error:', error);
    res.status(500).json({ message: 'Failed to fetch claims' });
  }
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', error);
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'File too large' });
  }
  
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ message: 'Unexpected file field' });
  }
  
  res.status(500).json({ message: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

export function startStandaloneServer() {
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Standalone Claims Platform running on port ${port}`);
    console.log(`📱 Frontend: http://localhost:${port}`);
    console.log(`🔧 API: http://localhost:${port}/api`);
    console.log(`💾 File uploads: http://localhost:${port}/uploads`);
    console.log(`🤖 AI Analysis: ${process.env.ENABLE_AI_ANALYSIS === 'true' ? 'Enabled' : 'Disabled'}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

  return server;
}

// Start server if this file is run directly
if (require.main === module) {
  startStandaloneServer();
}

export default app;