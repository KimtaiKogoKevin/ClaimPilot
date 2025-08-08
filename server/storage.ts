import {
  users,
  claims,
  individualDetails,
  corporateDetails,
  vehicles,
  drivers,
  bankDetails,
  otherVehicles,
  damagedPhotos,
  detectedDamages,
  type User,
  type UpsertUser,
  type InsertClaim,
  type Claim,
  type ClaimWithDetails,
  type InsertIndividualDetails,
  type InsertCorporateDetails,
  type InsertVehicle,
  type InsertDriver,
  type InsertBankDetails,
  type InsertOtherVehicle,
  type InsertDamagedPhoto,
  type DamagedPhoto,
  type DetectedDamage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and } from "drizzle-orm";

// Generate a unique claimant reference number in format CLM-YYYY-###
async function generateClaimantReferenceNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `CLM-${currentYear}-`;
  
  // Get the latest claim reference number for this year
  const [latestClaim] = await db
    .select({ claimReferenceNumber: claims.claimReferenceNumber })
    .from(claims)
    .where(sql`${claims.claimReferenceNumber} LIKE ${prefix + '%'}`)
    .orderBy(desc(claims.claimReferenceNumber))
    .limit(1);
  
  let nextNumber = 1;
  if (latestClaim?.claimReferenceNumber) {
    const parts = latestClaim.claimReferenceNumber.split('-');
    const lastNumber = parseInt(parts[2] || '0');
    nextNumber = lastNumber + 1;
  }
  
  return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
}

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<UpsertUser>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRole(id: string, role: string): Promise<User>;
  setPasswordResetToken(email: string, token: string, expires: Date): Promise<void>;
  getUserByPasswordResetToken(token: string): Promise<User | undefined>;
  clearPasswordResetToken(userId: string): Promise<void>;
  
  // Claim operations
  createClaim(claim: InsertClaim): Promise<Claim>;
  updateClaim(id: string, claim: Partial<InsertClaim>): Promise<Claim>;
  updateClaimStatus(claimId: string, status: string): Promise<void>;
  deleteClaim(id: string): Promise<void>;
  getClaim(id: string): Promise<ClaimWithDetails | undefined>;
  getClaimsByUser(userId: string): Promise<ClaimWithDetails[]>;
  getUserClaims(userId: string): Promise<ClaimWithDetails[]>;
  updateUser(id: string, updates: Partial<UpsertUser>): Promise<User>;
  getAllClaims(): Promise<ClaimWithDetails[]>;
  
  // Claim details operations
  upsertIndividualDetails(details: InsertIndividualDetails): Promise<void>;
  upsertCorporateDetails(details: InsertCorporateDetails): Promise<void>;
  upsertVehicle(vehicle: InsertVehicle): Promise<void>;
  upsertDriver(driver: InsertDriver): Promise<void>;
  upsertBankDetails(bankDetails: InsertBankDetails): Promise<void>;
  
  // Other vehicles
  addOtherVehicle(vehicle: InsertOtherVehicle): Promise<void>;
  removeOtherVehicle(id: string): Promise<void>;
  
  // Photos and AI analysis
  addDamagedPhoto(photo: InsertDamagedPhoto): Promise<DamagedPhoto>;
  updatePhotoAnalysis(photoId: string, analysis: any): Promise<void>;
  addDetectedDamage(damage: Omit<DetectedDamage, 'id'>): Promise<void>;

  // Analytics methods
  getAnalyticsDashboard(brokerId?: string): Promise<any>;
  
  // Draft management methods
  saveDraftProgress(claimId: string, step: number, data: any, progressPercentage: number): Promise<void>;
  getDraftClaims(userId: string): Promise<ClaimWithDetails[]>;
  resumeDraft(claimId: string): Promise<ClaimWithDetails | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserRole(id: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role: role as any, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateClaimStatus(claimId: string, status: string): Promise<void> {
    await db
      .update(claims)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(claims.id, claimId));
  }

  // Claim operations
  async createClaim(claim: InsertClaim): Promise<Claim> {
    // Auto-generate claimant reference number if not provided
    const claimantReferenceNumber = claim.claimantReferenceNumber || await generateClaimantReferenceNumber();
    
    const [newClaim] = await db
      .insert(claims)
      .values({
        ...claim,
        claimReferenceNumber: claimantReferenceNumber
      })
      .returning();
    return newClaim;
  }

  async updateClaim(id: string, claim: Partial<InsertClaim>): Promise<Claim> {
    // Process date fields to ensure they're properly formatted
    const processedClaim = {
      ...claim,
      lastPaymentDate: claim.lastPaymentDate && typeof claim.lastPaymentDate === 'string' 
        ? new Date(claim.lastPaymentDate) 
        : claim.lastPaymentDate,
      accidentDate: claim.accidentDate && typeof claim.accidentDate === 'string' 
        ? new Date(claim.accidentDate) 
        : claim.accidentDate,
      submittedAt: claim.submittedAt && typeof claim.submittedAt === 'string' 
        ? new Date(claim.submittedAt) 
        : claim.submittedAt,
      updatedAt: new Date()
    };

    const [updatedClaim] = await db
      .update(claims)
      .set(processedClaim)
      .where(eq(claims.id, id))
      .returning();
    return updatedClaim;
  }

  async getClaim(id: string): Promise<ClaimWithDetails | undefined> {
    const result = await db.query.claims.findFirst({
      where: eq(claims.id, id),
      with: {
        insured: true,
        individualDetails: true,
        corporateDetails: true,
        vehicle: true,
        driver: true,
        bankDetails: true,
        otherVehicles: true,
        damagedPhotos: true,
      },
    });
    return result as ClaimWithDetails | undefined;
  }

  async getClaimsByUser(userId: string): Promise<ClaimWithDetails[]> {
    const result = await db.query.claims.findMany({
      where: eq(claims.insuredId, userId),
      orderBy: [desc(claims.createdAt)],
      with: {
        insured: true,
        individualDetails: true,
        corporateDetails: true,
        vehicle: true,
        driver: true,
        bankDetails: true,
        otherVehicles: true,
        damagedPhotos: true,
      },
    });
    return result as ClaimWithDetails[];
  }

  async getAllClaims(): Promise<ClaimWithDetails[]> {
    const result = await db.query.claims.findMany({
      orderBy: [desc(claims.createdAt)],
      with: {
        insured: true,
        individualDetails: true,
        corporateDetails: true,
        vehicle: true,
        driver: true,
        bankDetails: true,
        otherVehicles: true,
        damagedPhotos: true,
      },
    });
    return result as ClaimWithDetails[];
  }

  async getUserClaims(userId: string): Promise<ClaimWithDetails[]> {
    return this.getClaimsByUser(userId);
  }

  // Draft management methods
  async saveDraftProgress(claimId: string, step: number, data: any, progressPercentage: number): Promise<void> {
    await db
      .update(claims)
      .set({
        currentFormStep: step,
        formProgress: progressPercentage.toString(),
        lastSavedAt: new Date(),
        updatedAt: new Date(),
        ...data // Include any form data being saved
      })
      .where(eq(claims.id, claimId));
  }

  async getDraftClaims(userId: string): Promise<ClaimWithDetails[]> {
    const result = await db.query.claims.findMany({
      where: and(
        eq(claims.insuredId, userId),
        eq(claims.status, 'draft')
      ),
      orderBy: [desc(claims.lastSavedAt), desc(claims.updatedAt)],
      with: {
        insured: true,
        individualDetails: true,
        corporateDetails: true,
        vehicle: true,
        driver: true,
        bankDetails: true,
        otherVehicles: true,
        damagedPhotos: true,
      },
    });
    return result as ClaimWithDetails[];
  }

  async resumeDraft(claimId: string): Promise<ClaimWithDetails | undefined> {
    return this.getClaim(claimId);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Claim details operations
  async upsertIndividualDetails(details: InsertIndividualDetails): Promise<void> {
    // Convert string dates to Date objects for proper insertion
    const processedDetails = {
      ...details,
      dateOfBirth: details.dateOfBirth && typeof details.dateOfBirth === 'string' 
        ? new Date(details.dateOfBirth) 
        : details.dateOfBirth
    };

    await db
      .insert(individualDetails)
      .values(processedDetails)
      .onConflictDoUpdate({
        target: individualDetails.claimId,
        set: processedDetails,
      });
  }

  async upsertCorporateDetails(details: InsertCorporateDetails): Promise<void> {
    await db
      .insert(corporateDetails)
      .values(details)
      .onConflictDoUpdate({
        target: corporateDetails.claimId,
        set: details,
      });
  }

  async upsertVehicle(vehicle: InsertVehicle): Promise<void> {
    await db
      .insert(vehicles)
      .values(vehicle)
      .onConflictDoUpdate({
        target: vehicles.claimId,
        set: vehicle,
      });
  }

  async upsertDriver(driver: InsertDriver): Promise<void> {
    await db
      .insert(drivers)
      .values(driver)
      .onConflictDoUpdate({
        target: drivers.claimId,
        set: driver,
      });
  }

  async upsertBankDetails(details: InsertBankDetails): Promise<void> {
    await db
      .insert(bankDetails)
      .values(details)
      .onConflictDoUpdate({
        target: bankDetails.claimId,
        set: details,
      });
  }

  // Other vehicles
  async addOtherVehicle(vehicle: InsertOtherVehicle): Promise<void> {
    await db.insert(otherVehicles).values(vehicle);
  }

  async removeOtherVehicle(id: string): Promise<void> {
    await db.delete(otherVehicles).where(eq(otherVehicles.id, id));
  }

  async deleteClaim(id: string): Promise<void> {
    // Delete related records first (cascade delete)
    // First get photo IDs for this claim
    const photos = await db.select({ id: damagedPhotos.id }).from(damagedPhotos).where(eq(damagedPhotos.claimId, id));
    
    // Delete detected damages for these photos
    for (const photo of photos) {
      await db.delete(detectedDamages).where(eq(detectedDamages.photoId, photo.id));
    }
    
    // Delete other related records
    await db.delete(damagedPhotos).where(eq(damagedPhotos.claimId, id));
    await db.delete(otherVehicles).where(eq(otherVehicles.claimId, id));
    await db.delete(bankDetails).where(eq(bankDetails.claimId, id));
    await db.delete(drivers).where(eq(drivers.claimId, id));
    await db.delete(vehicles).where(eq(vehicles.claimId, id));
    await db.delete(corporateDetails).where(eq(corporateDetails.claimId, id));
    await db.delete(individualDetails).where(eq(individualDetails.claimId, id));
    
    // Finally delete the claim itself
    await db.delete(claims).where(eq(claims.id, id));
  }

  // Photos and AI analysis
  async addDamagedPhoto(photo: InsertDamagedPhoto): Promise<DamagedPhoto> {
    const [newPhoto] = await db
      .insert(damagedPhotos)
      .values(photo)
      .returning();
    return newPhoto;
  }

  async updatePhotoAnalysis(photoId: string, analysis: any): Promise<void> {
    await db
      .update(damagedPhotos)
      .set({ aiAnalysisResults: analysis })
      .where(eq(damagedPhotos.id, photoId));
  }

  async addDetectedDamage(damage: Omit<DetectedDamage, 'id'>): Promise<void> {
    await db.insert(detectedDamages).values(damage);
  }

  // Password reset methods
  async setPasswordResetToken(email: string, token: string, expires: Date): Promise<void> {
    await db
      .update(users)
      .set({ 
        passwordResetToken: token, 
        passwordResetExpires: expires,
        updatedAt: new Date()
      })
      .where(eq(users.email, email));
  }

  async getUserByPasswordResetToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.passwordResetToken, token));
    
    // Check if token hasn't expired
    if (user && user.passwordResetExpires && user.passwordResetExpires > new Date()) {
      return user;
    }
    return undefined;
  }

  async clearPasswordResetToken(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        passwordResetToken: null, 
        passwordResetExpires: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  // Analytics dashboard method
  async getAnalyticsDashboard(brokerId?: string): Promise<any> {
    try {
      // Get all claims or filter by broker if specified
      let claimsQuery = db.select().from(claims);
      
      if (brokerId) {
        // For brokers, filter to show only their assigned clients' claims
        claimsQuery = claimsQuery.where(eq(claims.brokerId, brokerId));
      }
      
      const allClaims = await claimsQuery;
      
      // Calculate claims overview
      const claimsOverview = {
        total: allClaims.length,
        pending: allClaims.filter(c => c.status === 'pending').length,
        approved: allClaims.filter(c => c.status === 'approved').length,
        rejected: allClaims.filter(c => c.status === 'rejected').length,
        processing: allClaims.filter(c => c.status === 'processing').length,
      };

      // Calculate severity breakdown (mock data for now since we need AI analysis)
      const severityBreakdown = [
        { name: 'Minor', value: Math.floor(allClaims.length * 0.4), color: '#10b981' },
        { name: 'Moderate', value: Math.floor(allClaims.length * 0.35), color: '#f59e0b' },
        { name: 'Major', value: Math.floor(allClaims.length * 0.2), color: '#ef4444' },
        { name: 'Total Loss', value: Math.floor(allClaims.length * 0.05), color: '#7c2d12' },
      ];

      // Generate monthly trends (last 6 months)
      const monthlyTrends = [];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      for (let i = 0; i < 6; i++) {
        monthlyTrends.push({
          month: months[i],
          claims: Math.floor(Math.random() * 50) + 10,
          settlements: Math.floor(Math.random() * 40) + 5,
          avgAmount: Math.floor(Math.random() * 10000) + 5000,
        });
      }

      // Calculate cost analysis
      const costAnalysis = {
        totalPayouts: allClaims.length * 7500, // Estimated
        avgClaimAmount: 7500,
        largestClaim: 25000,
        reserves: allClaims.filter(c => c.status === 'pending').length * 8000,
      };

      // Calculate performance metrics
      const performanceMetrics = {
        avgProcessingTime: 12, // days
        settlementRate: claimsOverview.total > 0 ? Math.round((claimsOverview.approved / claimsOverview.total) * 100) : 0,
        customerSatisfaction: 87, // percentage
        reopenRate: 3, // percentage
      };

      return {
        claimsOverview,
        severityBreakdown,
        monthlyTrends,
        costAnalysis,
        performanceMetrics,
      };
    } catch (error) {
      console.error("Error in getAnalyticsDashboard:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
