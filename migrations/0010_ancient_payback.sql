ALTER TABLE "claims" ADD COLUMN "declaration_name" varchar;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "declaration_title" varchar;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "declaration_signature_path" varchar;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "years_in_service" varchar;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "employed_by_insured" boolean;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "driving_with_permission" boolean;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "years_of_driving" varchar;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "blame_to_bare_for_accident" boolean;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "admitted_liability" boolean;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "previous_accidents" boolean;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "previous_accidents_details" text;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "convictions" boolean;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "convictions_details" text;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "license_type" varchar;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "driving_test_passed_date" varchar;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "owns_motor_vehicle" boolean;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "own_vehicle_insurer" varchar;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "own_vehicle_policy_number" varchar;