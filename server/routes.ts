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
  resetPassword
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

  // Update user role
  app.put('/api/auth/update-role', authenticateToken, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      const { role } = req.body;
      
      if (!['insured', 'broker', 'insurer', 'service_provider'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      const updatedUser = await storage.updateUser(userId, { role });
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Create a new draft claim
  app.post("/api/claims", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).user?.id;

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
  app.put("/api/claims/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      // Verify user owns this claim
      const existingClaim = await storage.getClaim(id);
      if (!existingClaim || existingClaim.insuredId !== userId) {
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
  app.get("/api/claims", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).user?.id;

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
  app.get("/api/claims/drafts", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).user?.id;

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
  app.put("/api/claims/:id/save-draft", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { step, data, progressPercentage } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }

      // Verify user owns this claim
      const existingClaim = await storage.getClaim(id);
      if (!existingClaim || existingClaim.insuredId !== userId) {
        return res.status(404).json({ message: "Claim not found" });
      }

      // Debug logging to identify timestamp issues
      console.log("Save draft data received:", JSON.stringify(data, null, 2));
      
      await storage.saveDraftProgress(id, step, data, progressPercentage);
      res.json({ message: "Draft saved successfully" });
    } catch (error) {
      console.error("Error saving draft:", error);
      console.error("Draft data that caused error:", JSON.stringify(req.body.data, null, 2));
      res.status(500).json({ message: "Failed to save draft" });
    }
  });

  // Resume draft claim
  app.get("/api/claims/:id/resume", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }

      const claim = await storage.resumeDraft(id);
      if (!claim || claim.insuredId !== userId) {
        return res.status(404).json({ message: "Draft not found" });
      }

      res.json(claim);
    } catch (error) {
      console.error("Error resuming draft:", error);
      res.status(500).json({ message: "Failed to resume draft" });
    }
  });

  // Get claim details
  app.get("/api/claims/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const claim = await storage.getClaim(id);
      if (!claim || claim.insuredId !== userId) {
        return res.status(404).json({ message: "Claim not found" });
      }

      res.json(claim);
    } catch (error) {
      console.error("Error fetching claim:", error);
      res.status(500).json({ message: "Failed to fetch claim" });
    }
  });

  // Claim details routes
  app.post("/api/claims/:id/individual-details", authenticateToken, async (req, res) => {
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

  app.post("/api/claims/:id/corporate-details", authenticateToken, async (req, res) => {
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

  app.post("/api/claims/:id/vehicle", authenticateToken, async (req, res) => {
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

  app.post("/api/claims/:id/driver", authenticateToken, async (req, res) => {
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

  app.post("/api/claims/:id/bank-details", authenticateToken, async (req, res) => {
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

  app.post("/api/claims/:id/other-vehicles", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
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
  app.post("/api/claims/:id/photos", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      // Verify user owns this claim
      const claim = await storage.getClaim(id);
      if (!claim || claim.insuredId !== userId) {
        return res.status(404).json({ message: "Claim not found" });
      }
      
      const { imageUrl, angle, isGoodsPhoto } = req.body;
      
      if (!imageUrl || !angle) {
        return res.status(400).json({ message: "Image URL and angle are required" });
      }
      
      // Analyze image with Roboflow
      let detectedDamages = [];
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
        console.error("AI analysis failed:", analysisError);
        // Continue without AI analysis
      }
      
      const photoData = {
        claimId: id,
        objectPath: imageUrl,
        angle,
        isGoodsPhoto: !!isGoodsPhoto,
        aiAnalysisResults: detectedDamages,
      };
      
      const photo = await storage.addDamagedPhoto(photoData);
      res.status(201).json(photo);
    } catch (error) {
      console.error("Error adding damage photo:", error);
      res.status(500).json({ message: "Failed to add damage photo" });
    }
  });

  // Generate PDF for claim
  app.get("/api/claims/:id/pdf", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      // Verify user owns this claim
      const claim = await storage.getClaim(id);
      if (!claim || claim.insuredId !== userId) {
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
  app.post("/api/claims/:id/submit", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      // Verify user owns this claim
      const claim = await storage.getClaim(id);
      if (!claim || claim.insuredId !== userId) {
        return res.status(404).json({ message: "Claim not found" });
      }
      
      if (claim.status !== "draft") {
        return res.status(400).json({ message: "Only draft claims can be submitted" });
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
  app.get("/api/staff/claims", authenticateToken, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      const user = await storage.getUser(userId);
      
      // Check if user has staff access (broker or insurer)
      if (!user || (!['broker', 'insurer', 'admin'].includes(user.role))) {
        return res.status(403).json({ message: "Access denied. Staff access required." });
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
  app.get("/api/staff/claims/:id", authenticateToken, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      const user = await storage.getUser(userId);
      
      if (!user || (!['broker', 'insurer', 'admin'].includes(user.role))) {
        return res.status(403).json({ message: "Access denied. Staff access required." });
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
  app.get("/api/staff/claims/:id/pdf", authenticateToken, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      const user = await storage.getUser(userId);
      
      if (!user || (!['broker', 'insurer', 'admin'].includes(user.role))) {
        return res.status(403).json({ message: "Access denied. Staff access required." });
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
  app.put("/api/staff/claims/:id/status", authenticateToken, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      const user = await storage.getUser(userId);
      
      if (!user || (!['broker', 'insurer', 'admin'].includes(user.role))) {
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

  // Edit claim (insurer only)
  app.put("/api/staff/claims/:id/edit", authenticateToken, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'insurer') {
        return res.status(403).json({ message: "Access denied. Adjudicator access required." });
      }
      
      const updatedClaim = await storage.updateClaim(req.params.id, req.body);
      res.json(updatedClaim);
    } catch (error) {
      console.error("Error updating claim:", error);
      res.status(500).json({ message: "Failed to update claim" });
    }
  });

  // Delete claim (insurer only)
  app.delete("/api/staff/claims/:id", authenticateToken, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'insurer') {
        return res.status(403).json({ message: "Access denied. Adjudicator access required." });
      }
      
      await storage.deleteClaim(req.params.id);
      res.json({ success: true, message: "Claim deleted successfully" });
    } catch (error) {
      console.error("Error deleting claim:", error);
      res.status(500).json({ message: "Failed to delete claim" });
    }
  });

  // Object storage endpoints (simplified)
  app.get("/objects/:objectPath(*)", authenticateToken, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      
      const userId = (req.user as any)?.id;
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

  app.put("/api/damage-photos", authenticateToken, async (req, res) => {
    if (!req.body.photoURL) {
      return res.status(400).json({ error: "photoURL is required" });
    }

    const userId = (req.user as any)?.id;
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

  // Analytics dashboard endpoint with role-based permissions
  app.get("/api/analytics/dashboard", authenticateToken, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const user = await storage.getUser(userId);
      
      // Check if user has permission to access analytics
      if (!user || !['broker', 'insurer'].includes(user.role)) {
        return res.status(403).json({ 
          error: "Access denied. Analytics available only for Broker and Insurer roles." 
        });
      }

      const hasFullAccess = user.role === 'insurer';

      // Get analytics data based on role permissions
      let analyticsData;

      if (hasFullAccess) {
        // Insurers can see all claims across all brokers
        analyticsData = await storage.getAnalyticsDashboard();
      } else {
        // Brokers can only see their assigned clients' claims
        analyticsData = await storage.getAnalyticsDashboard(userId);
      }

      res.json(analyticsData);
    } catch (error) {
      console.error("Error fetching analytics dashboard:", error);
      res.status(500).json({ error: "Failed to load analytics data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}