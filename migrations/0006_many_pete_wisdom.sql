CREATE TYPE "public"."road_surface" AS ENUM('dry', 'murram', 'wet');--> statement-breakpoint
CREATE TYPE "public"."visibility" AS ENUM('clear', 'poor', 'dark');--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "road_surface" "road_surface";--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "visibility" "visibility";--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "driver_warning_given" text;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "vehicle_lights_on" text;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "police_took_particulars" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "police_constable_number" varchar;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "police_station" varchar;