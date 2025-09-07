ALTER TABLE "claims" ADD COLUMN "finance_company_name" varchar;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "has_other_insurance" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "other_insurance_details" text;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "has_loan_repayment_cover" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "loan_principal_amount" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "loan_interest_amount" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "monthly_instalment" numeric(12, 2);