ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "has_overtime" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "has_restday" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "has_holiday" boolean DEFAULT false NOT NULL;
