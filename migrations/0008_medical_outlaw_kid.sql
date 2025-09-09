CREATE TABLE "injured_persons" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_id" varchar NOT NULL,
	"person_name" varchar,
	"person_address" text,
	"relationship_to_insured" varchar,
	"vehicle_reg_no" varchar,
	"apparent_injuries" text
);
--> statement-breakpoint
CREATE TABLE "third_party_properties" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_id" varchar NOT NULL,
	"owner_name" varchar,
	"owner_address" text,
	"property_description" text
);
--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "inspection_location" text;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "repairer_name" varchar;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "repairer_address" text;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "repairer_phone" varchar;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "is_vehicle_in_use" boolean;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "goods_owner_name" varchar;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "was_trailer_attached" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "load_weight" varchar;--> statement-breakpoint
ALTER TABLE "injured_persons" ADD CONSTRAINT "injured_persons_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "third_party_properties" ADD CONSTRAINT "third_party_properties_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE no action ON UPDATE no action;