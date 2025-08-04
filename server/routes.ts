import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
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
} from "@shared/schema";
import { z } from "zod";
import { generateClaimPDF } from "./pdfGenerator";

// Roboflow analysis function
async function analyzeImageWithRoboflow(imageUrl: string, isGoodsPhoto: boolean = false) {
  const apiKey = process.env.ROBOFLOW_API_KEY;
  if (!apiKey) {
    throw new Error("ROBOFLOW_API_KEY not configured");
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
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user role
  app.put('/api/auth/update-role', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { role } = req.body;
      
      if (!['claimant', 'broker', 'adjudicator'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const updatedUser = await storage.updateUserRole(userId, role);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Object storage routes for protected file uploading
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req, res) => {
    const userId = req.user?.claims?.sub;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
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

  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  // Claims routes
  app.post("/api/claims", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const claimData = insertClaimSchema.parse({
        ...req.body,
        claimantId: userId,
      });

      const claim = await storage.createClaim(claimData);
      res.json(claim);
    } catch (error) {
      console.error("Error creating claim:", error);
      res.status(400).json({ message: "Invalid claim data" });
    }
  });

  app.patch("/api/claims/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      // Verify user owns this claim
      const existingClaim = await storage.getClaim(id);
      if (!existingClaim || existingClaim.claimantId !== userId) {
        return res.status(404).json({ message: "Claim not found" });
      }

      const updates = insertClaimSchema.partial().parse(req.body);
      const updatedClaim = await storage.updateClaim(id, updates);
      res.json(updatedClaim);
    } catch (error) {
      console.error("Error updating claim:", error);
      res.status(400).json({ message: "Invalid claim data" });
    }
  });

  app.get("/api/claims", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const claims = await storage.getClaimsByUser(userId);
      res.json(claims);
    } catch (error) {
      console.error("Error fetching claims:", error);
      res.status(500).json({ message: "Failed to fetch claims" });
    }
  });

  app.get("/api/claims/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      const claim = await storage.getClaim(id);
      if (!claim || claim.claimantId !== userId) {
        return res.status(404).json({ message: "Claim not found" });
      }

      res.json(claim);
    } catch (error) {
      console.error("Error fetching claim:", error);
      res.status(500).json({ message: "Failed to fetch claim" });
    }
  });

  // Claim details routes
  app.post("/api/claims/:id/individual-details", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
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

  app.post("/api/claims/:id/corporate-details", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
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

  app.post("/api/claims/:id/vehicle", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
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

  app.post("/api/claims/:id/driver", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
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

  app.post("/api/claims/:id/bank-details", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
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

  app.post("/api/claims/:id/other-vehicles", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const vehicle = insertOtherVehicleSchema.parse({
        ...req.body,
        claimId: id,
      });
      
      await storage.addOtherVehicle(vehicle);
      res.json({ success: true });
    } catch (error) {
      console.error("Error adding other vehicle:", error);
      res.status(400).json({ message: "Invalid vehicle data" });
    }
  });

  app.delete("/api/other-vehicles/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.removeOtherVehicle(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing other vehicle:", error);
      res.status(500).json({ message: "Failed to remove vehicle" });
    }
  });

  // Photo upload and AI analysis routes
  app.post("/api/claims/:id/photos", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      if (!req.body.photoUrl) {
        return res.status(400).json({ error: "photoUrl is required" });
      }

      // Verify user owns this claim
      const claim = await storage.getClaim(id);
      if (!claim || claim.claimantId !== userId) {
        return res.status(404).json({ message: "Claim not found" });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.photoUrl,
        {
          owner: userId,
          visibility: "private",
        },
      );

      const photoData = insertDamagedPhotoSchema.parse({
        claimId: id,
        objectPath,
        angle: req.body.angle,
        isGoodsPhoto: req.body.isGoodsPhoto || false,
      });

      const photo = await storage.addDamagedPhoto(photoData);

      // Trigger AI analysis in background
      try {
        const analysisResults = await analyzeImageWithRoboflow(
          req.body.photoUrl, 
          req.body.isGoodsPhoto || false
        );
        
        await storage.updatePhotoAnalysis(photo.id, analysisResults);
        
        // Save detected damages if any
        if (analysisResults.predictions && Array.isArray(analysisResults.predictions)) {
          for (const prediction of analysisResults.predictions) {
            await storage.addDetectedDamage({
              photoId: photo.id,
              damageType: prediction.class,
              confidence: prediction.confidence,
              boundingBox: {
                x: prediction.x,
                y: prediction.y,
                width: prediction.width,
                height: prediction.height,
              },
              severity: prediction.confidence > 0.8 ? 'severe' : prediction.confidence > 0.6 ? 'moderate' : 'minor',
              estimatedCost: null, // Could be calculated based on damage type and severity
            });
          }
        }
      } catch (aiError) {
        console.error("AI analysis failed:", aiError);
        // Continue without AI analysis - don't fail the upload
      }

      res.json({ 
        photo,
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error uploading photo:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Staff portal routes (simplified - would need additional role checking in production)
  app.get("/api/staff/claims", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Check if user has staff access (broker or adjudicator)
      if (!user || (!['broker', 'adjudicator', 'admin'].includes(user.role))) {
        return res.status(403).json({ message: "Access denied. Staff access required." });
      }
      
      const claims = await storage.getAllClaimsWithDetails();
      res.json(claims);
    } catch (error) {
      console.error("Error fetching all claims:", error);
      res.status(500).json({ message: "Failed to fetch claims" });
    }
  });

  // Get claim details for staff
  app.get("/api/staff/claims/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!['broker', 'adjudicator', 'admin'].includes(user.role))) {
        return res.status(403).json({ message: "Access denied. Staff access required." });
      }
      
      const claim = await storage.getClaimWithDetails(req.params.id);
      if (!claim) {
        return res.status(404).json({ message: "Claim not found" });
      }
      
      res.json(claim);
    } catch (error) {
      console.error("Error fetching claim details:", error);
      res.status(500).json({ message: "Failed to fetch claim details" });
    }
  });

  // Generate PDF for claim
  app.get("/api/staff/claims/:id/pdf", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!['broker', 'adjudicator', 'admin'].includes(user.role))) {
        return res.status(403).json({ message: "Access denied. Staff access required." });
      }
      
      const claim = await storage.getClaimWithDetails(req.params.id);
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
  app.put("/api/staff/claims/:id/status", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!['broker', 'adjudicator', 'admin'].includes(user.role))) {
        return res.status(403).json({ message: "Access denied. Staff access required." });
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

  app.patch("/api/staff/claims/:id/status", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!['under_review', 'approved', 'rejected', 'paid'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const updatedClaim = await storage.updateClaim(id, { 
        status,
        submittedAt: status === 'submitted' ? new Date() : undefined,
      });
      
      res.json(updatedClaim);
    } catch (error) {
      console.error("Error updating claim status:", error);
      res.status(500).json({ message: "Failed to update claim status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
