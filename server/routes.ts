import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  register, 
  login, 
  getCurrentUser, 
  logout, 
  setup2FA, 
  enable2FA, 
  disable2FA, 
  authenticateToken,
  forgotPassword,
  resetPassword,
  registerInsured,
  registerAdminRequest,
  getAdminSignupRequests,
  approveAdminSignupRequest,
  rejectAdminSignupRequest
} from "./standaloneAuth";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import {
  insertClaimSchema,
  insertIndividualDetailsSchema,
  insertCorporateDetailsSchema,
  insertVehicleSchema,
  insertDriverSchema,
  insertBankDetailsSchema,
  insertOtherVehicleSchema,
  insertDamagedPhotoSchema,
  adminCreateUserSchema,
  adminUpdateUserSchema,
  adminUpdateRoleSchema,
  adminBulkStatusSchema,
  adminBulkDeleteSchema,
  adminSystemSettingSchema,
} from "@shared/schema";
import { z } from "zod";
import { generateClaimPDF } from "./pdfGenerator";

// Helper function to check if user can access a claim
// Admins can access any claim, regular users can only access their own
async function canAccessClaim(userId: string, claim: any): Promise<boolean> {
  if (!claim) return false;
  
  // Check if user is admin (avoid DB call if role is in req.user)
  const user = await storage.getUser(userId);
  if (user?.role === 'admin') return true;
  
  // Non-admins can only access their own claims
  return claim.insuredId === userId;
}

// Roboflow analysis function
async function analyzeImageWithRoboflow(imageUrl: string, isGoodsPhoto: boolean = false) {
  const apiKey = process.env.ROBOFLOW_API_KEY;
  if (!apiKey) {
    console.warn("ROBOFLOW_API_KEY not configured - AI analysis will be skipped");
    return { predictions: [] };
  }

  const modelId = isGoodsPhoto 
    ? process.env.ROBOFLOW_GOODS_MODEL_ID || "goods-damage-model"
    : process.env.ROBOFLOW_VEHICLE_MODEL_ID || "vehicle-damage-model";

  try {
    const response = await fetch(`https://detect.roboflow.com/${modelId}/1?api_key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: imageUrl,
      }),
    });

    if (!response.ok) {
      throw new Error(`Roboflow API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Roboflow analysis error:", error);
    throw error;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Standalone authentication routes
  app.post('/api/auth/register', register);
  app.post('/api/auth/login', login);
  app.post('/api/auth/logout', logout);
  app.get('/api/auth/user', authenticateToken, getCurrentUser);
  app.post('/api/auth/2fa/setup', authenticateToken, setup2FA);
  app.post('/api/auth/2fa/enable', authenticateToken, enable2FA);
  app.post('/api/auth/2fa/disable', authenticateToken, disable2FA);
  app.post('/api/auth/forgot-password', forgotPassword);
  app.post('/api/auth/reset-password', resetPassword);
  
  // Separate signup flows
  app.post('/api/auth/signup/insured', registerInsured);
  app.post('/api/auth/signup/admin', registerAdminRequest);
  
  // Admin signup request management (admin only)
  app.get('/api/admin/signup-requests', authenticateToken, getAdminSignupRequests);
  app.post('/api/admin/signup-requests/:id/approve', authenticateToken, approveAdminSignupRequest);
  app.post('/api/admin/signup-requests/:id/reject', authenticateToken, rejectAdminSignupRequest);

  app.put('/api/auth/update-role', authenticateToken, async (req: any, res) => {
    try {
      const requestingUserId = req.user?.id || req.userId;
      if (!requestingUserId) {
        return res.status(401).json({ message: "User ID not found" });
      }

      const requestingUser = await storage.getUser(requestingUserId);
      if (!requestingUser || requestingUser.role !== 'admin') {
        return res.status(403).json({ message: "Only administrators can update user roles" });
      }

      const { role, targetUserId } = req.body;
      if (!targetUserId) {
        return res.status(400).json({ message: "targetUserId is required" });
      }

      if (!['insured', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role. Only 'insured' and 'admin' are allowed." });
      }

      const updatedUser = await storage.updateUser(targetUserId, { role });
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Create a new draft claim
  app.post("/api/claims", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.userId;

      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const claimData = insertClaimSchema.parse({
        ...req.body,
        insuredId: userId,
        status: "draft"
      });
      
      const claim = await storage.createClaim(claimData);
      res.status(201).json(claim);
    } catch (error) {
      console.error("Error creating claim:", error);
      res.status(400).json({ message: "Invalid claim data" });
    }
  });

  // Update a claim
  app.put("/api/claims/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      // Verify user can access this claim (admins can access any claim)
      const existingClaim = await storage.getClaim(id);
      const hasAccess = await canAccessClaim(userId, existingClaim);
      if (!hasAccess) {
        return res.status(404).json({ message: "Claim not found" });
      }
      
      const updateData = insertClaimSchema.partial().parse(req.body);
      const updatedClaim = await storage.updateClaim(id, updateData);
      res.json(updatedClaim);
    } catch (error) {
      console.error("Error updating claim:", error);
      res.status(400).json({ message: "Invalid claim data" });
    }
  });

  // Get user's claims
  app.get("/api/claims", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.userId;

      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const claims = await storage.getUserClaims(userId);
      res.json(claims);
    } catch (error) {
      console.error("Error fetching claims:", error);
      res.status(500).json({ message: "Failed to fetch claims" });
    }
  });

  // Get user's draft claims
  app.get("/api/claims/drafts", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.userId;

      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const draftClaims = await storage.getDraftClaims(userId);
      res.json(draftClaims);
    } catch (error) {
      console.error("Error fetching draft claims:", error);
      res.status(500).json({ message: "Failed to fetch draft claims" });
    }
  });

  // Save draft progress
  app.put("/api/claims/:id/save-draft", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { step, data, progressPercentage } = req.body;
      const userId = req.user?.id || req.userId;

      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }

      // Verify user can access this claim (admins can access any claim)
      const existingClaim = await storage.getClaim(id);
      const hasAccess = await canAccessClaim(userId, existingClaim);
      if (!hasAccess) {
        return res.status(404).json({ message: "Claim not found" });
      }

      await storage.saveDraftProgress(id, step, data, progressPercentage);
      res.json({ message: "Draft saved successfully" });
    } catch (error) {
      console.error("Error saving draft for claim:", req.params.id, "step:", req.body.step, error);
      res.status(500).json({ message: "Failed to save draft" });
    }
  });

  // Resume draft claim
  app.get("/api/claims/:id/resume", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id || req.userId;

      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }

      const claim = await storage.resumeDraft(id);
      const hasAccess = await canAccessClaim(userId, claim);
      if (!hasAccess) {
        return res.status(404).json({ message: "Draft not found" });
      }

      res.json(claim);
    } catch (error) {
      console.error("Error resuming draft:", error);
      res.status(500).json({ message: "Failed to resume draft" });
    }
  });

  // Get claim details
  app.get("/api/claims/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id || req.userId;
      
      // Enhanced logging for debugging
      console.log("GET /api/claims/:id Debug Info:", {
        claimId: id,
        hasReqUser: !!req.user,
        reqUserId: req.user?.id,
        hasReqUserIdProperty: !!req.userId,
        reqUserIdProperty: req.userId,
        finalUserId: userId,
        authHeader: !!req.headers.authorization
      });
      
      if (!userId) {
        console.error("User ID not found in request - auth failed");
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const claim = await storage.getClaim(id);
      const hasAccess = await canAccessClaim(userId, claim);
      if (!hasAccess) {
        console.log("Claim not found or access denied:", { 
          claimId: id,
          userId
        });
        return res.status(404).json({ message: "Claim not found" });
      }

      res.json(claim);
    } catch (error) {
      console.error("Error fetching claim:", error);
      res.status(500).json({ message: "Failed to fetch claim" });
    }
  });

  // Claim details routes
  app.post("/api/claims/:id/individual-details", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      // Verify user can access this claim (admins can access any claim)
      const claim = await storage.getClaim(id);
      const hasAccess = await canAccessClaim(userId, claim);
      if (!hasAccess) {
        return res.status(404).json({ message: "Claim not found" });
      }
      
      const details = insertIndividualDetailsSchema.parse({
        ...req.body,
        claimId: id,
      });
      
      await storage.upsertIndividualDetails(details);
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving individual details:", error);
      res.status(400).json({ message: "Invalid individual details" });
    }
  });

  app.post("/api/claims/:id/corporate-details", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      // Verify user can access this claim (admins can access any claim)
      const claim = await storage.getClaim(id);
      const hasAccess = await canAccessClaim(userId, claim);
      if (!hasAccess) {
        return res.status(404).json({ message: "Claim not found" });
      }
      
      const details = insertCorporateDetailsSchema.parse({
        ...req.body,
        claimId: id,
      });
      
      await storage.upsertCorporateDetails(details);
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving corporate details:", error);
      res.status(400).json({ message: "Invalid corporate details" });
    }
  });

  app.post("/api/claims/:id/vehicle", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      // Verify user can access this claim (admins can access any claim)
      const claim = await storage.getClaim(id);
      const hasAccess = await canAccessClaim(userId, claim);
      if (!hasAccess) {
        return res.status(404).json({ message: "Claim not found" });
      }
      
      const vehicle = insertVehicleSchema.parse({
        ...req.body,
        claimId: id,
      });
      
      await storage.upsertVehicle(vehicle);
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving vehicle details:", error);
      res.status(400).json({ message: "Invalid vehicle details" });
    }
  });

  app.post("/api/claims/:id/driver", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      // Verify user can access this claim (admins can access any claim)
      const claim = await storage.getClaim(id);
      const hasAccess = await canAccessClaim(userId, claim);
      if (!hasAccess) {
        return res.status(404).json({ message: "Claim not found" });
      }
      
      const driver = insertDriverSchema.parse({
        ...req.body,
        claimId: id,
      });
      
      await storage.upsertDriver(driver);
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving driver details:", error);
      res.status(400).json({ message: "Invalid driver details" });
    }
  });

  app.post("/api/claims/:id/bank-details", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      // Verify user can access this claim (admins can access any claim)
      const claim = await storage.getClaim(id);
      const hasAccess = await canAccessClaim(userId, claim);
      if (!hasAccess) {
        return res.status(404).json({ message: "Claim not found" });
      }
      
      const bankDetails = insertBankDetailsSchema.parse({
        ...req.body,
        claimId: id,
      });
      
      await storage.upsertBankDetails(bankDetails);
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving bank details:", error);
      res.status(400).json({ message: "Invalid bank details" });
    }
  });

  app.post("/api/claims/:id/other-vehicles", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      // Verify user can access this claim (admins can access any claim)
      const claim = await storage.getClaim(id);
      const hasAccess = await canAccessClaim(userId, claim);
      if (!hasAccess) {
        return res.status(404).json({ message: "Claim not found" });
      }
      
      const vehicle = insertOtherVehicleSchema.parse({
        ...req.body,
        claimId: id,
      });
      
      await storage.addOtherVehicle(vehicle);
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving other vehicle:", error);
      res.status(400).json({ message: "Invalid other vehicle data" });
    }
  });

  // Damage photo upload
  app.post("/api/claims/:id/photos", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      // Verify user can access this claim (admins can access any claim)
      const claim = await storage.getClaim(id);
      const hasAccess = await canAccessClaim(userId, claim);
      if (!hasAccess) {
        return res.status(404).json({ message: "Claim not found" });
      }
      
      const { imageUrl, angle, isGoodsPhoto } = req.body;
      
      if (!imageUrl || !angle) {
        return res.status(400).json({ message: "Image URL and angle are required" });
      }
      
      // Analyze image with Roboflow (optional - continues without if API key not set)
      let detectedDamages = [];
      const apiKey = process.env.ROBOFLOW_API_KEY;
      
      if (apiKey) {
        try {
          const analysisResult = await analyzeImageWithRoboflow(imageUrl, isGoodsPhoto);
          detectedDamages = analysisResult.predictions?.map((prediction: any) => ({
            damageType: prediction.class,
            confidence: prediction.confidence,
            boundingBox: {
              x: prediction.x,
              y: prediction.y,
              width: prediction.width,
              height: prediction.height,
            },
          })) || [];
        } catch (analysisError) {
          console.error("AI analysis failed (continuing without):", analysisError);
          // Continue without AI analysis
        }
      } else {
        console.log("ROBOFLOW_API_KEY not set - photo saved without AI analysis");
      }
      
      const photoData = {
        claimId: id,
        objectPath: imageUrl,
        angle,
        isGoodsPhoto: !!isGoodsPhoto,
        aiAnalysisResults: detectedDamages,
      };
      
      const photo = await storage.addDamagedPhoto(photoData);
      res.status(201).json({ photo, success: true });
    } catch (error) {
      console.error("Error adding damage photo:", error);
      res.status(500).json({ message: "Failed to add damage photo" });
    }
  });

  // Enhanced media upload endpoint (supports both images and videos)
  app.post("/api/claims/:id/media", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      // Verify user can access this claim (admins can access any claim)
      const claim = await storage.getClaim(id);
      const hasAccess = await canAccessClaim(userId, claim);
      if (!hasAccess) {
        return res.status(404).json({ message: "Claim not found" });
      }
      
      const { mediaUrl, mediaType, angle, isDamageZone, analyzeWithAI } = req.body;
      
      if (!mediaUrl || !mediaType || !angle) {
        return res.status(400).json({ message: "Media URL, type, and angle are required" });
      }
      
      let aiAnalysis = null;
      
      // Only analyze images with AI (not videos yet)
      if (analyzeWithAI && mediaType === 'image') {
        const apiKey = process.env.ROBOFLOW_API_KEY;
        
        if (apiKey) {
          try {
            const analysisResult = await analyzeImageWithRoboflow(mediaUrl, false);
            
            // Process AI results
            aiAnalysis = {
              predictions: analysisResult.predictions?.map((pred: any) => ({
                damageType: pred.class,
                confidence: pred.confidence,
                severity: pred.confidence > 0.8 ? 'high' : pred.confidence > 0.5 ? 'medium' : 'low',
                boundingBox: {
                  x: pred.x,
                  y: pred.y,
                  width: pred.width,
                  height: pred.height,
                },
              })) || [],
              totalDamages: analysisResult.predictions?.length || 0,
            };
          } catch (error) {
            console.error("AI analysis failed:", error);
            // Continue without AI analysis
          }
        } else {
          console.log("ROBOFLOW_API_KEY not set - using placeholder analysis");
          // Placeholder AI analysis for demonstration
          aiAnalysis = {
            predictions: [
              {
                damageType: 'dent',
                confidence: 0.85,
                severity: 'medium',
                boundingBox: { x: 100, y: 150, width: 50, height: 30 }
              },
              {
                damageType: 'scratch',
                confidence: 0.72,
                severity: 'low',
                boundingBox: { x: 200, y: 180, width: 80, height: 10 }
              }
            ],
            totalDamages: 2,
          };
        }
      }
      
      // Store media metadata
      const mediaData = {
        claimId: id,
        objectPath: mediaUrl,
        angle,
        isGoodsPhoto: isDamageZone,
        aiAnalysisResults: aiAnalysis,
      };
      
      const media = await storage.addDamagedPhoto(mediaData);
      
      res.status(201).json({ 
        media,
        aiAnalysis,
        success: true 
      });
    } catch (error) {
      console.error("Error uploading media:", error);
      res.status(500).json({ message: "Failed to upload media" });
    }
  });

  // Batch AI analysis endpoint for multiple media files
  app.post("/api/claims/:id/analyze", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      // Verify user can access this claim (admins can access any claim)
      const claim = await storage.getClaim(id);
      const hasAccess = await canAccessClaim(userId, claim);
      if (!hasAccess) {
        return res.status(404).json({ message: "Claim not found" });
      }
      
      const { mediaIds } = req.body;
      
      if (!mediaIds || !Array.isArray(mediaIds)) {
        return res.status(400).json({ message: "Media IDs array is required" });
      }
      
      // Get all media files for this claim
      const claimMedia = await storage.getDamagedPhotos(id);
      
      let totalDamages = 0;
      const results = [];
      
      // Placeholder comprehensive analysis
      // In production, this would batch process all media through the AI model
      for (const media of claimMedia) {
        if (!media.aiAnalysisResults) {
          // Simulate AI analysis for media that hasn't been analyzed
          const analysis = {
            mediaId: media.id,
            damageType: ['dent', 'scratch', 'crack'][Math.floor(Math.random() * 3)],
            severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
            confidence: Math.random() * 0.5 + 0.5,
            estimatedCost: Math.floor(Math.random() * 2000) + 500,
          };
          results.push(analysis);
          totalDamages++;
        } else {
          // Use existing analysis
          const existing = media.aiAnalysisResults as any;
          if (existing.predictions) {
            totalDamages += existing.predictions.length;
            results.push(...existing.predictions);
          }
        }
      }
      
      // Generate comprehensive assessment
      const assessment = {
        totalDamages,
        analyzedMedia: claimMedia.length,
        results,
        overallSeverity: totalDamages > 5 ? 'high' : totalDamages > 2 ? 'medium' : 'low',
        estimatedTotalCost: results.reduce((sum: number, r: any) => sum + (r.estimatedCost || 0), 0),
        repairability: totalDamages > 10 ? 'total_loss' : 'repairable',
        recommendations: [
          'Professional body shop assessment recommended',
          'Multiple damage points detected requiring specialized repair',
          'Insurance adjuster review suggested for accurate valuation'
        ]
      };
      
      // Update claim with AI analysis summary
      await storage.updateClaim(id, {
        aiAnalysisSummary: JSON.stringify(assessment),
      });
      
      res.json(assessment);
    } catch (error) {
      console.error("Error analyzing media:", error);
      res.status(500).json({ message: "Failed to analyze media" });
    }
  });

  // Add document for a claim
  app.post("/api/claims/:id/documents", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      // Verify user can access this claim (admins can access any claim)
      const claim = await storage.getClaim(id);
      const hasAccess = await canAccessClaim(userId, claim);
      if (!hasAccess) {
        return res.status(404).json({ message: "Claim not found" });
      }
      
      const { documentUrl, documentType } = req.body;
      
      if (!documentUrl || !documentType) {
        return res.status(400).json({ message: "Document URL and type are required" });
      }
      
      // Save document metadata - using the damaged_photos table which can store any files
      const documentData = {
        claimId: id,
        objectPath: documentUrl,
        angle: documentType, // Using angle field to store document type
        isGoodsPhoto: false,
        aiAnalysisResults: null,
      };
      
      const document = await storage.addDamagedPhoto(documentData);
      res.status(201).json({ document, success: true });
    } catch (error) {
      console.error("Error adding document:", error);
      res.status(500).json({ message: "Failed to add document" });
    }
  });

  // Generate PDF for claim
  app.get("/api/claims/:id/pdf", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      // Verify user can access this claim (admins can access any claim)
      const claim = await storage.getClaim(id);
      if (!claim) {
        return res.status(404).json({ message: "Claim not found" });
      }
      const hasAccess = await canAccessClaim(userId, claim);
      if (!hasAccess) {
        return res.status(404).json({ message: "Claim not found" });
      }
      
      // Generate PDF content
      const pdfContent = await generateClaimPDF(claim);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="claim-${claim.id}.pdf"`);
      res.send(pdfContent);
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // Submit a claim (change status from draft to submitted)
  app.post("/api/claims/:id/submit", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      // Verify user can access this claim (admins can access any claim)
      const claim = await storage.getClaim(id);
      if (!claim) {
        return res.status(404).json({ message: "Claim not found" });
      }
      const hasAccess = await canAccessClaim(userId, claim);
      if (!hasAccess) {
        return res.status(404).json({ message: "Claim not found" });
      }
      
      console.log("🔍 SUBMIT VALIDATION - Claim data check:", {
        hasDriver: !!claim.driver,
        driverData: claim.driver,
        hasBankDetails: !!claim.bankDetails,
        bankData: claim.bankDetails,
        claimStatus: claim.status
      });
      
      if (claim.status !== "draft") {
        return res.status(400).json({ message: "Only draft claims can be submitted" });
      }
      
      // Validate completeness before submission
      const validationErrors = [];
      
      // Check required claim fields
      if (!claim.policyNumber) validationErrors.push("Policy number is required");
      if (!claim.accidentDate) validationErrors.push("Accident date is required");
      if (!claim.accidentLocation) validationErrors.push("Accident location is required");
      if (!claim.accidentDescription) validationErrors.push("Accident description is required");
      
      // Check insured details (individual or corporate)
      if (claim.insuredType === 'individual') {
        if (!claim.individualDetails) {
          validationErrors.push("Individual insured details are required");
        } else {
          if (!claim.individualDetails.firstName) validationErrors.push("First name is required");
          if (!claim.individualDetails.surname) validationErrors.push("Surname is required");
          if (!claim.individualDetails.idNumber) validationErrors.push("ID/Passport number is required");
        }
      } else if (claim.insuredType === 'corporate') {
        if (!claim.corporateDetails) {
          validationErrors.push("Corporate insured details are required");
        } else {
          if (!claim.corporateDetails.registeredName) validationErrors.push("Company name is required");
          if (!claim.corporateDetails.registrationNumber) validationErrors.push("Registration number is required");
        }
      }
      
      // Check vehicle details
      if (!claim.vehicle) {
        validationErrors.push("Vehicle details are required");
      } else {
        if (!claim.vehicle.make) validationErrors.push("Vehicle make is required");
        if (!claim.vehicle.model) validationErrors.push("Vehicle model is required");
        if (!claim.vehicle.registrationNumber_primemover) validationErrors.push("Vehicle registration is required");
      }
      
      // Check driver details
      if (!claim.driver) {
        validationErrors.push("Driver details are required");
      } else {
        if (!claim.driver.name) validationErrors.push("Driver name is required");
        if (!claim.driver.licenseNumber) validationErrors.push("Driver license number is required");
      }
      
      // Check bank details
      if (!claim.bankDetails) {
        validationErrors.push("Bank details are required");
      } else {
        if (!claim.bankDetails.bankName) validationErrors.push("Bank name is required");
        if (!claim.bankDetails.accountName) validationErrors.push("Account name is required");
        if (!claim.bankDetails.accountNumber) validationErrors.push("Account number is required");
      }
      
      // Return validation errors if any
      if (validationErrors.length > 0) {
        console.log("🔍 SUBMIT VALIDATION FAILED - Missing fields:", validationErrors);
        return res.status(400).json({ 
          message: "Claim is incomplete and cannot be submitted",
          errors: validationErrors,
          missingFields: validationErrors.length
        });
      }
      
      // Update claim status to submitted and set submittedAt timestamp
      await storage.updateClaimStatus(id, "submitted");
      await storage.updateClaim(id, { submittedAt: new Date() });
      
      res.json({ success: true, message: "Claim submitted successfully" });
    } catch (error) {
      console.error("Error submitting claim:", error);
      res.status(500).json({ message: "Failed to submit claim" });
    }
  });

  // Staff portal routes (simplified - would need additional role checking in production)
  app.get("/api/staff/claims", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      const user = await storage.getUser(userId);
      
      // Check if user has staff access (broker or insurer)
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin access required." });
      }
      
      // Get claims with full details for staff portal
      const claims = await storage.getAllClaims();
      res.json(claims);
    } catch (error) {
      console.error("Error fetching all claims:", error);
      res.status(500).json({ message: "Failed to fetch claims" });
    }
  });

  // Get claim details for staff
  app.get("/api/staff/claims/:id", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin access required." });
      }
      
      // Get claim with full details for staff portal
      const claim = await storage.getClaim(req.params.id);
      if (!claim) {
        return res.status(404).json({ message: "Claim not found" });
      }
      
      res.json(claim);
    } catch (error) {
      console.error("Error fetching claim details:", error);
      res.status(500).json({ message: "Failed to fetch claim details" });
    }
  });

  // Generate PDF for claim - Staff version
  app.get("/api/staff/claims/:id/pdf", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin access required." });
      }
      
      // Get claim with full details for PDF generation
      const claim = await storage.getClaim(req.params.id);
      if (!claim) {
        return res.status(404).json({ message: "Claim not found" });
      }
      
      // Generate PDF content
      const pdfContent = await generateClaimPDF(claim);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="claim-${claim.id}.pdf"`);
      res.send(pdfContent);
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // Update claim status
  app.put("/api/staff/claims/:id/status", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin access required." });
      }
      
      const { status } = req.body;
      if (!['submitted', 'under_review', 'approved', 'rejected', 'paid'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const updatedClaim = await storage.updateClaim(req.params.id, { status });
      res.json(updatedClaim);
    } catch (error) {
      console.error("Error updating claim status:", error);
      res.status(500).json({ message: "Failed to update claim status" });
    }
  });

  // Edit claim (admin only)
  app.put("/api/staff/claims/:id/edit", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin access required." });
      }
      
      const updatedClaim = await storage.updateClaim(req.params.id, req.body);
      res.json(updatedClaim);
    } catch (error) {
      console.error("Error updating claim:", error);
      res.status(500).json({ message: "Failed to update claim" });
    }
  });

  // Delete claim (admin only)
  app.delete("/api/staff/claims/:id", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin access required." });
      }
      
      await storage.deleteClaim(req.params.id);
      res.json({ success: true, message: "Claim deleted successfully" });
    } catch (error) {
      console.error("Error deleting claim:", error);
      res.status(500).json({ message: "Failed to delete claim" });
    }
  });

  // Object storage endpoints (simplified)
  app.get("/objects/:objectPath(*)", authenticateToken, async (req: any, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      
      const userId = req.user?.id || req.userId;
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", authenticateToken, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  app.put("/api/damage-photos", authenticateToken, async (req: any, res) => {
    if (!req.body.photoURL) {
      return res.status(400).json({ error: "photoURL is required" });
    }

    const userId = req.user?.id || req.userId;
    if (!userId) {
      return res.status(401).json({ message: "User ID not found" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.photoURL,
        {
          owner: userId,
          visibility: "private",
        },
      );

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting damage photo:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin Routes - RBAC protected (admin role required)
  
  // User Management Routes
  app.get("/api/admin/users", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      
      const { role, search } = req.query;
      const filters: any = {};
      if (role) filters.role = role as string;
      if (search) filters.search = search as string;
      
      const users = await storage.getAllUsers(filters);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      
      const validatedData = adminCreateUserSchema.parse(req.body);
      const newUser = await storage.createUser(validatedData);
      
      await storage.createAuditLog({
        adminId: userId,
        action: 'create',
        entityType: 'user',
        entityId: newUser.id,
        changes: { created: validatedData },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      
      res.status(201).json(newUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/admin/users/:id", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      
      const { id } = req.params;
      const validatedData = adminUpdateUserSchema.parse(req.body);
      
      const updatedUser = await storage.updateUser(id, validatedData);
      
      await storage.createAuditLog({
        adminId: userId,
        action: 'update',
        entityType: 'user',
        entityId: id,
        changes: { updates: validatedData },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      
      res.json(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
      }
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      
      const { id } = req.params;
      
      if (id === userId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      await storage.deleteUser(id);
      
      await storage.createAuditLog({
        adminId: userId,
        action: 'delete',
        entityType: 'user',
        entityId: id,
        changes: null,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.put("/api/admin/users/:id/role", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      
      const { id } = req.params;
      const validatedData = adminUpdateRoleSchema.parse(req.body);
      
      const updatedUser = await storage.updateUserRole(id, validatedData.role);
      
      await storage.createAuditLog({
        adminId: userId,
        action: 'update_role',
        entityType: 'user',
        entityId: id,
        changes: { role: validatedData.role },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      
      res.json(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
      }
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.post("/api/admin/users/:id/reset-password", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      
      const { id } = req.params;
      const targetUser = await storage.getUser(id);
      
      if (!targetUser || !targetUser.email) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const resetToken = Math.random().toString(36).substring(2, 15);
      const expires = new Date();
      expires.setHours(expires.getHours() + 24);
      
      await storage.setPasswordResetToken(targetUser.email, resetToken, expires);
      
      await storage.createAuditLog({
        adminId: userId,
        action: 'reset_password',
        entityType: 'user',
        entityId: id,
        changes: null,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      
      res.json({ message: "Password reset initiated", resetToken });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Claim Management Routes
  app.post("/api/admin/claims/bulk-status", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      
      const validatedData = adminBulkStatusSchema.parse(req.body);
      
      await storage.bulkUpdateClaimStatus(validatedData.claimIds, validatedData.status);
      
      await storage.createAuditLog({
        adminId: userId,
        action: 'bulk_update_status',
        entityType: 'claim',
        entityId: validatedData.claimIds.join(','),
        changes: { status: validatedData.status, count: validatedData.claimIds.length },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      
      res.json({ message: `Updated ${validatedData.claimIds.length} claims to ${validatedData.status}` });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
      }
      console.error("Error bulk updating claims:", error);
      res.status(500).json({ message: "Failed to bulk update claims" });
    }
  });

  app.post("/api/admin/claims/bulk-delete", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      
      const validatedData = adminBulkDeleteSchema.parse(req.body);
      
      await storage.bulkDeleteClaims(validatedData.claimIds);
      
      await storage.createAuditLog({
        adminId: userId,
        action: 'bulk_delete',
        entityType: 'claim',
        entityId: validatedData.claimIds.join(','),
        changes: { count: validatedData.claimIds.length },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      
      res.json({ message: `Deleted ${validatedData.claimIds.length} claims` });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
      }
      console.error("Error bulk deleting claims:", error);
      res.status(500).json({ message: "Failed to bulk delete claims" });
    }
  });

  // Analytics & Stats Routes
  app.get("/api/admin/stats", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      
      const stats = await storage.getSystemStats();
      const analytics = await storage.getAdminAnalytics();
      
      res.json({
        ...stats,
        analytics,
      });
    } catch (error) {
      console.error("Error fetching system stats:", error);
      res.status(500).json({ message: "Failed to fetch system stats" });
    }
  });

  // System Settings Routes
  app.get("/api/admin/settings", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      
      const { category } = req.query;
      const settings = await storage.getSystemSettings(category as string);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put("/api/admin/settings", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      
      const validatedData = adminSystemSettingSchema.parse(req.body);
      const settingData = { ...validatedData, updatedBy: userId };
      const setting = await storage.upsertSystemSetting(settingData);
      
      await storage.createAuditLog({
        adminId: userId,
        action: 'upsert_setting',
        entityType: 'system_setting',
        entityId: setting.key,
        changes: settingData,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      
      res.json(setting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
      }
      console.error("Error upserting setting:", error);
      res.status(500).json({ message: "Failed to save setting" });
    }
  });

  app.delete("/api/admin/settings/:key", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      
      const { key } = req.params;
      await storage.deleteSystemSetting(key);
      
      await storage.createAuditLog({
        adminId: userId,
        action: 'delete_setting',
        entityType: 'system_setting',
        entityId: key,
        changes: null,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      
      res.json({ message: "Setting deleted successfully" });
    } catch (error) {
      console.error("Error deleting setting:", error);
      res.status(500).json({ message: "Failed to delete setting" });
    }
  });

  // Audit Log Routes
  app.get("/api/admin/audit-logs", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      
      const { adminId, entityType, startDate, endDate } = req.query;
      const filters: any = {};
      
      if (adminId) filters.adminId = adminId as string;
      if (entityType) filters.entityType = entityType as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      
      const logs = await storage.getAuditLogs(filters);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // Analytics dashboard endpoint - admin only
  app.get("/api/analytics/dashboard", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const user = await storage.getUser(userId);
      
      // Check if user has permission to access analytics (admin only)
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ 
          error: "Access denied. Analytics available only for admin users." 
        });
      }

      // Admins can see all claims
      const analyticsData = await storage.getAnalyticsDashboard();

      res.json(analyticsData);
    } catch (error) {
      console.error("Error fetching analytics dashboard:", error);
      res.status(500).json({ error: "Failed to load analytics data" });
    }
  });

  // Collaboration API Routes
  // Get active edit session for a claim
  app.get("/api/claims/:id/edit-session", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const session = await storage.getActiveEditSession(id);
      res.json({ session });
    } catch (error) {
      console.error("Error fetching edit session:", error);
      res.status(500).json({ message: "Failed to fetch edit session" });
    }
  });

  // Get claim change history
  app.get("/api/claims/:id/change-history", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const history = await storage.getClaimChangeHistory(id, limit);
      res.json(history);
    } catch (error) {
      console.error("Error fetching change history:", error);
      res.status(500).json({ message: "Failed to fetch change history" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}