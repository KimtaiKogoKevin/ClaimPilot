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
import { eq, desc, sql } from "drizzle-orm";

// Generate a unique claimant reference number in format CLM-YYYY-###
async function generateClaimantReferenceNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `CLM-${currentYear}-`;
  
  // Get the latest claimant reference number for this year
  const [latestClaim] = await db
    .select({ claimantReferenceNumber: claims.claimantReferenceNumber })
    .from(claims)
    .where(sql`${claims.claimantReferenceNumber} LIKE ${prefix + '%'}`)
    .orderBy(desc(claims.claimantReferenceNumber))
    .limit(1);
  
  let nextNumber = 1;
  if (latestClaim?.claimantReferenceNumber) {
    const parts = latestClaim.claimantReferenceNumber.split('-');
    const lastNumber = parseInt(parts[2] || '0');
    nextNumber = lastNumber + 1;
  }
  
  return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
}

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail?(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRole(id: string, role: string): Promise<User>;
  
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
        claimantReferenceNumber
      })
      .returning();
    return newClaim;
  }

  async updateClaim(id: string, claim: Partial<InsertClaim>): Promise<Claim> {
    const [updatedClaim] = await db
      .update(claims)
      .set({ ...claim, updatedAt: new Date() })
      .where(eq(claims.id, id))
      .returning();
    return updatedClaim;
  }

  async getClaim(id: string): Promise<ClaimWithDetails | undefined> {
    const result = await db.query.claims.findFirst({
      where: eq(claims.id, id),
      with: {
        claimant: true,
        individualDetails: true,
        corporateDetails: true,
        vehicle: true,
        driver: true,
        bankDetails: true,
        otherVehicles: true,
        damagedPhotos: {
          with: {
            detectedDamages: true,
          },
        },
      },
    });
    return result as ClaimWithDetails | undefined;
  }

  async getClaimsByUser(userId: string): Promise<ClaimWithDetails[]> {
    const result = await db.query.claims.findMany({
      where: eq(claims.claimantId, userId),
      orderBy: [desc(claims.createdAt)],
      with: {
        claimant: true,
        individualDetails: true,
        corporateDetails: true,
        vehicle: true,
        driver: true,
        bankDetails: true,
        otherVehicles: true,
        damagedPhotos: {
          with: {
            detectedDamages: true,
          },
        },
      },
    });
    return result as ClaimWithDetails[];
  }

  async getAllClaims(): Promise<ClaimWithDetails[]> {
    const result = await db.query.claims.findMany({
      orderBy: [desc(claims.createdAt)],
      with: {
        claimant: true,
        individualDetails: true,
        corporateDetails: true,
        vehicle: true,
        driver: true,
        bankDetails: true,
        otherVehicles: true,
        damagedPhotos: {
          with: {
            detectedDamages: true,
          },
        },
      },
    });
    return result as ClaimWithDetails[];
  }

  async getUserClaims(userId: string): Promise<ClaimWithDetails[]> {
    return this.getClaimsByUser(userId);
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
    await db
      .insert(individualDetails)
      .values(details)
      .onConflictDoUpdate({
        target: individualDetails.claimId,
        set: details,
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

  async upsertBankDetails(bankDetails: InsertBankDetails): Promise<void> {
    await db
      .insert(bankDetails)
      .values(bankDetails)
      .onConflictDoUpdate({
        target: bankDetails.claimId,
        set: bankDetails,
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
}

export const storage = new DatabaseStorage();
