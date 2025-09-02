CREATE TYPE "public"."assessment_status" AS ENUM('pending', 'in_progress', 'completed', 'requires_review');--> statement-breakpoint
CREATE TYPE "public"."claim_status" AS ENUM('draft', 'submitted', 'under_review', 'investigating', 'assessment_pending', 'approved', 'rejected', 'settlement_pending', 'paid', 'closed');--> statement-breakpoint
CREATE TYPE "public"."damage_type" AS ENUM('dent', 'scratch', 'crack', 'broken', 'missing', 'paint_damage', 'glass_damage', 'structural_damage');--> statement-breakpoint
CREATE TYPE "public"."insured_type" AS ENUM('individual', 'corporate');--> statement-breakpoint
CREATE TYPE "public"."photo_angle" AS ENUM('FRONT_VIEW', 'REAR_VIEW', 'LEFT_SIDE', 'RIGHT_SIDE', 'DAMAGE_CLOSEUP');--> statement-breakpoint
CREATE TYPE "public"."severity_level" AS ENUM('minor', 'moderate', 'major', 'total_loss');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('insured', 'insurer', 'broker', 'service_provider', 'admin');--> statement-breakpoint
CREATE TABLE "ai_analysis_results" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_id" varchar NOT NULL,
	"model_version" varchar NOT NULL,
	"total_damage_count" integer NOT NULL,
	"overall_severity" "severity_level" NOT NULL,
	"total_estimated_cost" numeric(10, 2),
	"repairability" varchar,
	"ai_summary" text,
	"recommended_actions" text,
	"confidence_score" numeric(5, 4),
	"processing_time_ms" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bank_details" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_id" varchar NOT NULL,
	"bank_name" varchar NOT NULL,
	"account_name" varchar NOT NULL,
	"account_number" varchar NOT NULL,
	"branch" varchar,
	"swift_code" varchar,
	"sort_code" varchar
);
--> statement-breakpoint
CREATE TABLE "claim_communications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_id" varchar NOT NULL,
	"from_user_id" varchar NOT NULL,
	"to_user_id" varchar,
	"message_type" varchar NOT NULL,
	"subject" varchar,
	"content" text NOT NULL,
	"attachments" jsonb,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "claim_workflows" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_id" varchar NOT NULL,
	"current_stage" varchar NOT NULL,
	"assigned_to_user_id" varchar,
	"assigned_by_user_id" varchar,
	"due_date" timestamp,
	"priority" varchar DEFAULT 'medium',
	"notes" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "claims" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"insured_id" varchar NOT NULL,
	"claim_reference_number" varchar,
	"status" "claim_status" DEFAULT 'draft' NOT NULL,
	"branch_name" varchar,
	"agent_name" varchar,
	"broker_id" varchar,
	"policy_number" varchar NOT NULL,
	"last_payment_date" timestamp,
	"type_of_cover" varchar DEFAULT '' NOT NULL,
	"insured_type" "insured_type" NOT NULL,
	"assessment_status" "assessment_status" DEFAULT 'pending',
	"assigned_service_provider_id" varchar,
	"estimated_repair_cost" numeric(10, 2),
	"final_settlement_amount" numeric(10, 2),
	"ai_analysis_summary" text,
	"insurer_notes" text,
	"broker_notes" text,
	"accident_date" timestamp,
	"accident_time" varchar,
	"accident_location" text,
	"accident_description" text,
	"vehicle_damage_description" text,
	"goods_damaged" boolean DEFAULT false,
	"goods_description" text,
	"ai_analysis_results" jsonb,
	"current_form_step" integer DEFAULT 1,
	"completed_steps" jsonb DEFAULT '[]'::jsonb,
	"form_progress" numeric(5, 2) DEFAULT '0',
	"last_saved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"submitted_at" timestamp,
	CONSTRAINT "claims_claim_reference_number_unique" UNIQUE("claim_reference_number")
);
--> statement-breakpoint
CREATE TABLE "corporate_details" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_id" varchar NOT NULL,
	"registered_name" varchar NOT NULL,
	"registration_number" varchar NOT NULL,
	"country_of_registration" varchar,
	"pin_number" varchar,
	"vat_reg_number" varchar,
	"office_phone" varchar,
	"mobile_contact" varchar,
	"postal_address" text,
	"postal_code" varchar,
	"physical_address" text,
	"email" varchar,
	"trade_business" varchar,
	"years_in_operation" varchar,
	CONSTRAINT "corporate_details_claim_id_unique" UNIQUE("claim_id")
);
--> statement-breakpoint
CREATE TABLE "damaged_photos" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_id" varchar NOT NULL,
	"object_path" varchar NOT NULL,
	"angle" "photo_angle",
	"is_goods_photo" boolean DEFAULT false,
	"ai_analysis_results" jsonb,
	"uploaded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "detected_damages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_id" varchar NOT NULL,
	"photo_id" varchar NOT NULL,
	"damage_type" "damage_type" NOT NULL,
	"confidence" numeric(5, 4) NOT NULL,
	"bounding_box" jsonb NOT NULL,
	"severity" "severity_level" NOT NULL,
	"estimated_cost" numeric(10, 2),
	"description" text,
	"ai_explanation" text,
	"repair_recommendations" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"occupation" varchar,
	"address" text,
	"date_of_birth" timestamp,
	"telephone" varchar,
	"license_number" varchar NOT NULL,
	"employed_by_insured" boolean,
	"driving_with_permission" boolean,
	"years_of_driving" integer,
	"blame_to_bare_for_accident" boolean,
	"admitted_liability" boolean,
	"previous_accidents" boolean,
	"previous_accidents_details" text,
	"convictions" boolean,
	"convictions_details" text,
	"license_type" varchar,
	"driving_test_passed_date" timestamp,
	"owns_motor_vehicle" boolean,
	"own_vehicle_insurer" varchar,
	"own_vehicle_policy_number" varchar,
	CONSTRAINT "drivers_claim_id_unique" UNIQUE("claim_id")
);
--> statement-breakpoint
CREATE TABLE "individual_details" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_id" varchar NOT NULL,
	"first_name" varchar NOT NULL,
	"middle_name" varchar,
	"surname" varchar NOT NULL,
	"id_number" varchar NOT NULL,
	"nationality" varchar,
	"date_of_birth" timestamp,
	"pin_number" varchar,
	"occupation" varchar,
	"residential_phone" varchar,
	"office_phone" varchar,
	"mobile" varchar,
	"postal_address" text,
	"postal_code" varchar,
	"physical_address" text,
	"email" varchar,
	"trade_business" varchar,
	CONSTRAINT "individual_details_claim_id_unique" UNIQUE("claim_id")
);
--> statement-breakpoint
CREATE TABLE "other_vehicles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_id" varchar NOT NULL,
	"owner_name" varchar,
	"owner_address" text,
	"registration_number" varchar,
	"insurer" varchar
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"password" varchar,
	"role" "user_role" DEFAULT 'insured' NOT NULL,
	"two_factor_enabled" boolean DEFAULT false,
	"two_factor_secret" varchar,
	"password_reset_token" varchar,
	"password_reset_expires" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_id" varchar NOT NULL,
	"make" varchar NOT NULL,
	"model" varchar NOT NULL,
	"year_of_manufacture" integer,
	"registration_number" varchar,
	"carrying_capacity" varchar,
	"loading_capacity" varchar,
	"owner_name" varchar,
	"owner_address" text,
	"vehicle_use" text,
	CONSTRAINT "vehicles_claim_id_unique" UNIQUE("claim_id")
);
--> statement-breakpoint
ALTER TABLE "ai_analysis_results" ADD CONSTRAINT "ai_analysis_results_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_details" ADD CONSTRAINT "bank_details_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_communications" ADD CONSTRAINT "claim_communications_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_communications" ADD CONSTRAINT "claim_communications_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_communications" ADD CONSTRAINT "claim_communications_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_workflows" ADD CONSTRAINT "claim_workflows_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_workflows" ADD CONSTRAINT "claim_workflows_assigned_to_user_id_users_id_fk" FOREIGN KEY ("assigned_to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_workflows" ADD CONSTRAINT "claim_workflows_assigned_by_user_id_users_id_fk" FOREIGN KEY ("assigned_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_insured_id_users_id_fk" FOREIGN KEY ("insured_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_broker_id_users_id_fk" FOREIGN KEY ("broker_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_assigned_service_provider_id_users_id_fk" FOREIGN KEY ("assigned_service_provider_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corporate_details" ADD CONSTRAINT "corporate_details_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damaged_photos" ADD CONSTRAINT "damaged_photos_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detected_damages" ADD CONSTRAINT "detected_damages_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detected_damages" ADD CONSTRAINT "detected_damages_photo_id_damaged_photos_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."damaged_photos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "individual_details" ADD CONSTRAINT "individual_details_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "other_vehicles" ADD CONSTRAINT "other_vehicles_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");