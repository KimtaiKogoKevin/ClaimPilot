CREATE TABLE "passengers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_id" varchar NOT NULL,
	"passenger_name" varchar,
	"passenger_address" text
);
--> statement-breakpoint
CREATE TABLE "witnesses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_id" varchar NOT NULL,
	"witness_name" varchar,
	"witness_address" text
);
--> statement-breakpoint
ALTER TABLE "passengers" ADD CONSTRAINT "passengers_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "witnesses" ADD CONSTRAINT "witnesses_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE no action ON UPDATE no action;