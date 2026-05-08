ALTER TABLE "area_setting" ADD COLUMN IF NOT EXISTS "hours_per_week" real DEFAULT 45 NOT NULL;--> statement-breakpoint
ALTER TABLE "area_setting" ADD COLUMN IF NOT EXISTS "days_per_month" real DEFAULT 24 NOT NULL;--> statement-breakpoint
ALTER TABLE "area_setting" ADD COLUMN IF NOT EXISTS "work_start" text DEFAULT '07:00' NOT NULL;--> statement-breakpoint
ALTER TABLE "area_setting" ADD COLUMN IF NOT EXISTS "work_end" text DEFAULT '16:00' NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "salary_week" real;
