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

// User roles enum - Claims Management System
export const userRoleEnum = pgEnum('user_role', ['insured', 'insurer', 'broker', 'service_provider', 'admin']);

// User storage table (supports both Replit Auth and standalone auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  password: varchar("password"), // For standalone auth
  role: userRoleEnum("role").default('insured').notNull(),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  twoFactorSecret: varchar("two_factor_secret"),
  passwordResetToken: varchar("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enums
export const insuredTypeEnum = pgEnum('insured_type', ['individual', 'corporate']);
export const claimStatusEnum = pgEnum('claim_status', ['draft', 'submitted', 'under_review', 'investigating', 'assessment_pending', 'approved', 'rejected', 'settlement_pending', 'paid', 'closed']);
export const damageTypeEnum = pgEnum('damage_type', ['dent', 'scratch', 'crack', 'broken', 'missing', 'paint_damage', 'glass_damage', 'structural_damage']);
export const photoAngleEnum = pgEnum('photo_angle', ['FRONT_VIEW', 'REAR_VIEW', 'LEFT_SIDE', 'RIGHT_SIDE', 'DAMAGE_CLOSEUP']);
export const assessmentStatusEnum = pgEnum('assessment_status', ['pending', 'in_progress', 'completed', 'requires_review']);
export const severityLevelEnum = pgEnum('severity_level', ['minor', 'moderate', 'major', 'total_loss']);
export const ageBandEnum = pgEnum("age_band", [
  "18-21",
  "22-40",
  "41-69",
  "70+",
]);
export const operationYearsEnum = pgEnum("operation_years", [
  "0-1",
  "2-3",
  "4-5",
  "5+",
]);
export const roadSurfaceEnum = pgEnum("road_surface", ["dry", "murram", "wet"]);
export const visibilityEnum = pgEnum("visibility", ["clear", "poor", "dark"]);


// Claims table
export const claims = pgTable("claims", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  insuredId: varchar("insured_id")
    .notNull()
    .references(() => users.id),
  claimReferenceNumber: varchar("claim_reference_number").unique(),
  status: claimStatusEnum("status").default("draft").notNull(),

  // Policy details
  branchName: varchar("branch_name"),
  agentName: varchar("agent_name"),
  brokerId: varchar("broker_id").references(() => users.id), // Assigned broker
  policyNumber: varchar("policy_number").notNull(),
  lastPaymentDate: timestamp("last_payment_date"),
  typeOfCover: varchar("type_of_cover").notNull().default(""),
  insuredType: insuredTypeEnum("insured_type").notNull(),
  financeCompanyName: varchar("finance_company_name"),
  hasOtherInsurance: boolean("has_other_insurance").default(false),
  otherInsuranceDetails: text("other_insurance_details"),
  hasLoanRepaymentCover: boolean("has_loan_repayment_cover").default(false),
  loanPrincipalAmount: decimal("loan_principal_amount", {
    precision: 12,
    scale: 2,
  }),
  loanInterestAmount: decimal("loan_interest_amount", {
    precision: 12,
    scale: 2,
  }),
  monthlyInstalment: decimal("monthly_instalment", { precision: 12, scale: 2 }),
  loanCoveragePercentage: decimal("loan_coverage_percentage", {
    precision: 5,
    scale: 2,
  }),

  // Assessment and AI Analysis
  assessmentStatus:
    assessmentStatusEnum("assessment_status").default("pending"),
  assignedServiceProviderId: varchar("assigned_service_provider_id").references(
    () => users.id
  ),
  estimatedRepairCost: decimal("estimated_repair_cost", {
    precision: 10,
    scale: 2,
  }),
  finalSettlementAmount: decimal("final_settlement_amount", {
    precision: 10,
    scale: 2,
  }),
  aiAnalysisSummary: text("ai_analysis_summary"),
  insurerNotes: text("insurer_notes"),
  brokerNotes: text("broker_notes"),

  // Accident details
  accidentDate: timestamp("accident_date"),
  accidentTime: varchar("accident_time"),
  accidentLocation: text("accident_location"),
  accidentDescription: text("accident_description"),
  roadSurface: roadSurfaceEnum("road_surface"),
  visibility: visibilityEnum("visibility"),
  driverWarningGiven: text("driver_warning_given"),
  vehicleLightsOn: text("vehicle_lights_on"),
  policeTookParticulars: boolean("police_took_particulars").default(false),
  policeConstableNumber: varchar("police_constable_number"),
  policeStation: varchar("police_station"),
  accidentSketchPath: varchar("accident_sketch_path"),

  // Damage details
  vehicleDamageDescription: text("vehicle_damage_description"),
  goodsDamaged: boolean("goods_damaged").default(false),
  goodsDescription: text("goods_description"),
  inspectionLocation: text("inspection_location"),
  repairerName: varchar("repairer_name"),
  repairerAddress: text("repairer_address"),
  repairerPhone: varchar("repairer_phone"),
  isVehicleInUse: boolean("is_vehicle_in_use"),
  goodsOwnerName: varchar("goods_owner_name"),
  wasTrailerAttached: boolean("was_trailer_attached").default(false),
  loadWeight: varchar("load_weight"),

  // AI Analysis results
  aiAnalysisResults: jsonb("ai_analysis_results"),

  // Draft tracking for step-by-step form saving
  currentFormStep: integer("current_form_step").default(1), // Track which step user is on
  completedSteps: jsonb("completed_steps").default([]), // Array of completed step numbers
  formProgress: decimal("form_progress", { precision: 5, scale: 2 }).default(
    "0"
  ), // Percentage completed
  lastSavedAt: timestamp("last_saved_at"), // When was this draft last saved

  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  submittedAt: timestamp("submitted_at"),
  declarationName: varchar("declaration_name"),
  declarationTitle: varchar("declaration_title"),
  declarationSignaturePath: varchar("declaration_signature_path"),
  yearsInService: varchar("years_in_service"), // "How long in your service?"
  employedByInsured: boolean("employed_by_insured"),
  drivingWithPermission: boolean("driving_with_permission"),
  yearsOfDriving: varchar("years_of_driving"), // "How long driving motor vehicles?"
  blameToBareForAccident: boolean("blame_to_bare_for_accident"),
  admittedLiability: boolean("admitted_liability"),
  previousAccidents: boolean("previous_accidents"),
  previousAccidentsDetails: text("previous_accidents_details"), // Details if yes
  convictions: boolean("convictions"),
  convictionsDetails: text("convictions_details"), // Details if yes
  licenseType: varchar("license_type"), // Full or Provisional
  drivingTestPassedDate: varchar("driving_test_passed_date"), // Can be just the year
  ownsMotorVehicle: boolean("owns_motor_vehicle"),
  ownVehicleInsurer: varchar("own_vehicle_insurer"),
  ownVehiclePolicyNumber: varchar("own_vehicle_policy_number"),
});


// VVVVVV CREATE THESE NEW TABLES FOR ONE-TO-MANY DATA VVVVVV
export const thirdPartyProperties = pgTable("third_party_properties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  claimId: varchar("claim_id").notNull().references(() => claims.id),
  ownerName: varchar("owner_name"),
  ownerAddress: text("owner_address"),
  propertyDescription: text("property_description"),
});

export const injuredPersons = pgTable("injured_persons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  claimId: varchar("claim_id").notNull().references(() => claims.id),
  personName: varchar("person_name"),
  personAddress: text("person_address"),
  relationshipToInsured: varchar("relationship_to_insured"),
  vehicleRegNo: varchar("vehicle_reg_no"),
  apparentInjuries: text("apparent_injuries"),
});

// Individual insured details
export const individualDetails = pgTable("individual_details", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  claimId: varchar("claim_id")
    .notNull()
    .references(() => claims.id)
    .unique(),
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
  ageBand: ageBandEnum("age_band").notNull(),
});

// Corporate insured details
export const corporateDetails = pgTable("corporate_details", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  claimId: varchar("claim_id").notNull().references(() => claims.id).unique(),
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
  registrationNumber_primemover: varchar("registration_number_primemover"),
  registrationNumber_trailer: varchar("registration_no_trailer"),
  carryingCapacity: varchar("carrying_capacity"),
  loadingCapacity: varchar("loading_capacity"),
  ownerName: varchar("owner_name"),
  ownerAddress: text("owner_address"),
  vehicleUse: text("vehicle_use"),
});

// Driver details
export const drivers = pgTable("drivers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  claimId: varchar("claim_id").notNull().references(() => claims.id).unique(),
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
  claimId: varchar("claim_id").notNull().references(() => claims.id),
  photoId: varchar("photo_id").notNull().references(() => damagedPhotos.id),
  damageType: damageTypeEnum("damage_type").notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 4 }).notNull(),
  boundingBox: jsonb("bounding_box").notNull(), // {x, y, width, height}
  severity: severityLevelEnum("severity").notNull(),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  description: text("description"),
  aiExplanation: text("ai_explanation"), // LLM explanation of the damage
  repairRecommendations: text("repair_recommendations"),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI Analysis Results table for comprehensive assessments
export const aiAnalysisResults = pgTable("ai_analysis_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  claimId: varchar("claim_id").notNull().references(() => claims.id),
  modelVersion: varchar("model_version").notNull(),
  totalDamageCount: integer("total_damage_count").notNull(),
  overallSeverity: severityLevelEnum("overall_severity").notNull(),
  totalEstimatedCost: decimal("total_estimated_cost", { precision: 10, scale: 2 }),
  repairability: varchar("repairability"), // repairable, total_loss, questionable
  aiSummary: text("ai_summary"), // LLM generated summary
  recommendedActions: text("recommended_actions"), // Next steps suggested by AI
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 4 }),
  processingTime: integer("processing_time_ms"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Workflow tracking table for multi-role collaboration
export const claimWorkflows = pgTable("claim_workflows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  claimId: varchar("claim_id").notNull().references(() => claims.id),
  currentStage: varchar("current_stage").notNull(), // submission, investigation, assessment, review, settlement
  assignedToUserId: varchar("assigned_to_user_id").references(() => users.id),
  assignedByUserId: varchar("assigned_by_user_id").references(() => users.id),
  dueDate: timestamp("due_date"),
  priority: varchar("priority").default('medium'), // low, medium, high, urgent
  notes: text("notes"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Communication logs between different roles
export const claimCommunications = pgTable("claim_communications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  claimId: varchar("claim_id").notNull().references(() => claims.id),
  fromUserId: varchar("from_user_id").notNull().references(() => users.id),
  toUserId: varchar("to_user_id").references(() => users.id), // null for broadcast messages
  messageType: varchar("message_type").notNull(), // note, question, approval_request, decision
  subject: varchar("subject"),
  content: text("content").notNull(),
  attachments: jsonb("attachments"), // file references
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
// Passengers in your vehicle
export const passengers = pgTable("passengers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  claimId: varchar("claim_id").notNull().references(() => claims.id),
  passengerName: varchar("passenger_name"),
  passengerAddress: text("passenger_address"),
});

// Independent Witnesses
export const witnesses = pgTable("witnesses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  claimId: varchar("claim_id").notNull().references(() => claims.id),
  witnessName: varchar("witness_name"),
  witnessAddress: text("witness_address"),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  claims: many(claims),
}));

export const claimsRelations = relations(claims, ({ one, many }) => ({
  insured: one(users, {
    fields: [claims.insuredId],
    references: [users.id],
  }),
  broker: one(users, {
    fields: [claims.brokerId],
    references: [users.id],
  }),
  serviceProvider: one(users, {
    fields: [claims.assignedServiceProviderId],
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

  thirdPartyProperties: many(thirdPartyProperties),
  injuredPersons: many(injuredPersons),
  passengers: many(passengers),
  witnesses: many(witnesses),
}));

export const thirdPartyPropertiesRelations = relations(
  thirdPartyProperties,
  ({ one }) => ({
    claim: one(claims, {
      fields: [thirdPartyProperties.claimId],
      references: [claims.id],
    }),
  })
);

export const injuredPersonsRelations = relations(injuredPersons, ({ one }) => ({
  claim: one(claims, {
    fields: [injuredPersons.claimId],
    references: [claims.id],
  }),
}));
export const passengersRelations = relations(passengers, ({ one }) => ({
  claim: one(claims, { fields: [passengers.claimId], references: [claims.id] }),
}));

export const witnessesRelations = relations(witnesses, ({ one }) => ({
  claim: one(claims, { fields: [witnesses.claimId], references: [claims.id] }),
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
  accidentDate: z.union([z.string(), z.date(), z.null()]).transform((val) => 
    typeof val === 'string' && val ? new Date(val) : val
  ).optional().nullable(),
  lastPaymentDate: z.union([z.string(), z.date(), z.null()]).transform((val) => 
    typeof val === 'string' && val ? new Date(val) : val
  ).optional().nullable(),
  submittedAt: z.union([z.string(), z.date(), z.null()]).transform((val) => 
    typeof val === 'string' && val ? new Date(val) : val
  ).optional().nullable(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIndividualDetailsSchema = createInsertSchema(individualDetails, {
  dateOfBirth: z.union([z.string(), z.date(), z.null()]).transform((val) => 
    typeof val === 'string' && val ? new Date(val) : val
  ).optional().nullable(),
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

// Authentication schemas  
export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(['claimant', 'broker', 'adjudicator']).default('claimant'),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
  twoFactorCode: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
