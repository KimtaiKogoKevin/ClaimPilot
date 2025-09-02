CREATE TYPE "public"."age_band" AS ENUM('18-21', '22-40', '41-69', '70+');--> statement-breakpoint
ALTER TABLE "individual_details" ADD COLUMN "age_band" "age_band" NOT NULL;