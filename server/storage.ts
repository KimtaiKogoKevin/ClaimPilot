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
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Claim operations
  createClaim(claim: InsertClaim): Promise<Claim>;
  updateClaim(id: string, claim: Partial<InsertClaim>): Promise<Claim>;
  getClaim(id: string): Promise<ClaimWithDetails | undefined>;
  getClaimsByUser(userId: string): Promise<ClaimWithDetails[]>;
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

  // Claim operations
  async createClaim(claim: InsertClaim): Promise<Claim> {
    const [newClaim] = await db
      .insert(claims)
      .values(claim)
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
