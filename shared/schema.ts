import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoleEnum = pgEnum('user_role', ['claimant', 'broker', 'adjudicator', 'admin']);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default('claimant').notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enums
export const insuredTypeEnum = pgEnum('insured_type', ['individual', 'corporate']);
export const claimStatusEnum = pgEnum('claim_status', ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'paid']);
export const damageTypeEnum = pgEnum('damage_type', ['dent', 'scratch', 'crack', 'broken', 'missing']);
export const photoAngleEnum = pgEnum('photo_angle', ['FRONT_VIEW', 'REAR_VIEW', 'LEFT_SIDE', 'RIGHT_SIDE', 'DAMAGE_CLOSEUP']);

// Claims table
export const claims = pgTable("claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  claimantId: varchar("claimant_id").notNull().references(() => users.id),
  status: claimStatusEnum("status").default('draft').notNull(),
  
  // Policy details
  branchName: varchar("branch_name"),
  agentName: varchar("agent_name"),
  policyNumber: varchar("policy_number").notNull(),
  lastPaymentDate: timestamp("last_payment_date"),
  insuredType: insuredTypeEnum("insured_type").notNull(),
  
  // Accident details
  accidentDate: timestamp("accident_date"),
  accidentTime: varchar("accident_time"),
  accidentLocation: text("accident_location"),
  accidentDescription: text("accident_description"),
  
  // Damage details
  vehicleDamageDescription: text("vehicle_damage_description"),
  goodsDamaged: boolean("goods_damaged").default(false),
  goodsDescription: text("goods_description"),
  
  // AI Analysis results
  aiAnalysisResults: jsonb("ai_analysis_results"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  submittedAt: timestamp("submitted_at"),
});

// Individual insured details
export const individualDetails = pgTable("individual_details", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  claimId: varchar("claim_id").notNull().references(() => claims.id),
  firstName: varchar("first_name").notNull(),
  middleName: varchar("middle_name"),
  surname: varchar("surname").notNull(),
  idNumber: varchar("id_number").notNull(),
  nationality: varchar("nationality"),
  dateOfBirth: timestamp("date_of_birth"),
  pinNumber: varchar("pin_number"),
  occupation: varchar("occupation"),
  residentialPhone: varchar("residential_phone"),
  officePhone: varchar("office_phone"),
  mobile: varchar("mobile"),
  postalAddress: text("postal_address"),
  postalCode: varchar("postal_code"),
  physicalAddress: text("physical_address"),
  email: varchar("email"),
  tradeBusiness: varchar("trade_business"),
});

// Corporate insured details
export const corporateDetails = pgTable("corporate_details", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  claimId: varchar("claim_id").notNull().references(() => claims.id),
  registeredName: varchar("registered_name").notNull(),
  registrationNumber: varchar("registration_number").notNull(),
  countryOfRegistration: varchar("country_of_registration"),
  pinNumber: varchar("pin_number"),
  vatRegNumber: varchar("vat_reg_number"),
  officePhone: varchar("office_phone"),
  mobileContact: varchar("mobile_contact"),
  postalAddress: text("postal_address"),
  postalCode: varchar("postal_code"),
  physicalAddress: text("physical_address"),
  email: varchar("email"),
  tradeBusiness: varchar("trade_business"),
  yearsInOperation: varchar("years_in_operation"),
});

// Vehicle details
export const vehicles = pgTable("vehicles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  claimId: varchar("claim_id").notNull().references(() => claims.id).unique(),
  make: varchar("make").notNull(),
  model: varchar("model").notNull(),
  yearOfManufacture: integer("year_of_manufacture"),
  registrationNumber: varchar("registration_number"),
  carryingCapacity: varchar("carrying_capacity"),
  loadingCapacity: varchar("loading_capacity"),
  ownerName: varchar("owner_name"),
  ownerAddress: text("owner_address"),
  vehicleUse: text("vehicle_use"),
});

// Driver details
export const drivers = pgTable("drivers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  claimId: varchar("claim_id").notNull().references(() => claims.id),
  name: varchar("name").notNull(),
  occupation: varchar("occupation"),
  address: text("address"),
  dateOfBirth: timestamp("date_of_birth"),
  telephone: varchar("telephone"),
  licenseNumber: varchar("license_number").notNull(),
  employedByInsured: boolean("employed_by_insured"),
  drivingWithPermission: boolean("driving_with_permission"),
  yearsOfDriving: integer("years_of_driving"),
  blameToBareForAccident: boolean("blame_to_bare_for_accident"),
  admittedLiability: boolean("admitted_liability"),
  previousAccidents: boolean("previous_accidents"),
  previousAccidentsDetails: text("previous_accidents_details"),
  convictions: boolean("convictions"),
  convictionsDetails: text("convictions_details"),
  licenseType: varchar("license_type"),
  drivingTestPassedDate: timestamp("driving_test_passed_date"),
  ownsMotorVehicle: boolean("owns_motor_vehicle"),
  ownVehicleInsurer: varchar("own_vehicle_insurer"),
  ownVehiclePolicyNumber: varchar("own_vehicle_policy_number"),
});

// Bank details
export const bankDetails = pgTable("bank_details", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  claimId: varchar("claim_id").notNull().references(() => claims.id),
  bankName: varchar("bank_name").notNull(),
  accountName: varchar("account_name").notNull(),
  accountNumber: varchar("account_number").notNull(),
  branch: varchar("branch"),
  swiftCode: varchar("swift_code"),
  sortCode: varchar("sort_code"),
});

// Other vehicles involved
export const otherVehicles = pgTable("other_vehicles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  claimId: varchar("claim_id").notNull().references(() => claims.id),
  ownerName: varchar("owner_name"),
  ownerAddress: text("owner_address"),
  registrationNumber: varchar("registration_number"),
  insurer: varchar("insurer"),
});

// Damaged photos
export const damagedPhotos = pgTable("damaged_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  claimId: varchar("claim_id").notNull().references(() => claims.id),
  objectPath: varchar("object_path").notNull(),
  angle: photoAngleEnum("angle"),
  isGoodsPhoto: boolean("is_goods_photo").default(false),
  aiAnalysisResults: jsonb("ai_analysis_results"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Detected damages (from AI analysis)
export const detectedDamages = pgTable("detected_damages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  photoId: varchar("photo_id").notNull().references(() => damagedPhotos.id),
  damageType: damageTypeEnum("damage_type").notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 4 }),
  boundingBox: jsonb("bounding_box"), // {x, y, width, height}
  severity: varchar("severity"), // 'minor', 'moderate', 'severe'
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  claims: many(claims),
}));

export const claimsRelations = relations(claims, ({ one, many }) => ({
  claimant: one(users, {
    fields: [claims.claimantId],
    references: [users.id],
  }),
  individualDetails: one(individualDetails, {
    fields: [claims.id],
    references: [individualDetails.claimId],
  }),
  corporateDetails: one(corporateDetails, {
    fields: [claims.id],
    references: [corporateDetails.claimId],
  }),
  vehicle: one(vehicles, {
    fields: [claims.id],
    references: [vehicles.claimId],
  }),
  driver: one(drivers, {
    fields: [claims.id],
    references: [drivers.claimId],
  }),
  bankDetails: one(bankDetails, {
    fields: [claims.id],
    references: [bankDetails.claimId],
  }),
  otherVehicles: many(otherVehicles),
  damagedPhotos: many(damagedPhotos),
}));

// Add missing relations for all entities
export const individualDetailsRelations = relations(individualDetails, ({ one }) => ({
  claim: one(claims, {
    fields: [individualDetails.claimId],
    references: [claims.id],
  }),
}));

export const corporateDetailsRelations = relations(corporateDetails, ({ one }) => ({
  claim: one(claims, {
    fields: [corporateDetails.claimId],
    references: [claims.id],
  }),
}));

export const vehiclesRelations = relations(vehicles, ({ one }) => ({
  claim: one(claims, {
    fields: [vehicles.claimId],
    references: [claims.id],
  }),
}));

export const driversRelations = relations(drivers, ({ one }) => ({
  claim: one(claims, {
    fields: [drivers.claimId],
    references: [claims.id],
  }),
}));

export const bankDetailsRelations = relations(bankDetails, ({ one }) => ({
  claim: one(claims, {
    fields: [bankDetails.claimId],
    references: [claims.id],
  }),
}));

export const otherVehiclesRelations = relations(otherVehicles, ({ one }) => ({
  claim: one(claims, {
    fields: [otherVehicles.claimId],
    references: [claims.id],
  }),
}));

export const damagedPhotosRelations = relations(damagedPhotos, ({ one, many }) => ({
  claim: one(claims, {
    fields: [damagedPhotos.claimId],
    references: [claims.id],
  }),
  detectedDamages: many(detectedDamages),
}));

export const detectedDamagesRelations = relations(detectedDamages, ({ one }) => ({
  photo: one(damagedPhotos, {
    fields: [detectedDamages.photoId],
    references: [damagedPhotos.id],
  }),
}));

// Insert schemas with date transformations
export const insertClaimSchema = createInsertSchema(claims, {
  accidentDate: z.union([z.string(), z.date()]).transform((val) => 
    typeof val === 'string' && val ? new Date(val) : val
  ).optional(),
  lastPaymentDate: z.union([z.string(), z.date()]).transform((val) => 
    typeof val === 'string' && val ? new Date(val) : val
  ).optional(),
  submittedAt: z.union([z.string(), z.date()]).transform((val) => 
    typeof val === 'string' && val ? new Date(val) : val
  ).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIndividualDetailsSchema = createInsertSchema(individualDetails, {
  dateOfBirth: z.union([z.string(), z.date()]).transform((val) => 
    typeof val === 'string' && val ? new Date(val) : val
  ).optional(),
}).omit({
  id: true,
});

export const insertCorporateDetailsSchema = createInsertSchema(corporateDetails).omit({
  id: true,
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
});

export const insertDriverSchema = createInsertSchema(drivers).omit({
  id: true,
});

export const insertBankDetailsSchema = createInsertSchema(bankDetails).omit({
  id: true,
});

export const insertOtherVehicleSchema = createInsertSchema(otherVehicles).omit({
  id: true,
});

export const insertDamagedPhotoSchema = createInsertSchema(damagedPhotos).omit({
  id: true,
  uploadedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertClaim = z.infer<typeof insertClaimSchema>;
export type Claim = typeof claims.$inferSelect;
export type InsertIndividualDetails = z.infer<typeof insertIndividualDetailsSchema>;
export type IndividualDetails = typeof individualDetails.$inferSelect;
export type InsertCorporateDetails = z.infer<typeof insertCorporateDetailsSchema>;
export type CorporateDetails = typeof corporateDetails.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;
export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Driver = typeof drivers.$inferSelect;
export type InsertBankDetails = z.infer<typeof insertBankDetailsSchema>;
export type BankDetails = typeof bankDetails.$inferSelect;
export type InsertOtherVehicle = z.infer<typeof insertOtherVehicleSchema>;
export type OtherVehicle = typeof otherVehicles.$inferSelect;
export type InsertDamagedPhoto = z.infer<typeof insertDamagedPhotoSchema>;
export type DamagedPhoto = typeof damagedPhotos.$inferSelect;
export type DetectedDamage = typeof detectedDamages.$inferSelect;

// Full claim type with relations
export type ClaimWithDetails = Claim & {
  claimant: User;
  individualDetails?: IndividualDetails;
  corporateDetails?: CorporateDetails;
  vehicle?: Vehicle;
  driver?: Driver;
  bankDetails?: BankDetails;
  otherVehicles: OtherVehicle[];
  damagedPhotos: (DamagedPhoto & {
    detectedDamages: DetectedDamage[];
  })[];
};
