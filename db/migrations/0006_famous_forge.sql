DO $$ BEGIN
  CREATE TYPE "public"."break_type" AS ENUM('30m', '1h', '2h', 'none');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
ALTER TABLE "employee_form" ADD COLUMN IF NOT EXISTS "contact_number" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "employee_form" ADD COLUMN IF NOT EXISTS "email" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "contact_number" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "email" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "salary_other" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "break_type" "break_type";--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "monday_start" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "monday_end" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "monday_break" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "tuesday_start" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "tuesday_end" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "tuesday_break" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "wednesday_start" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "wednesday_end" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "wednesday_break" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "thursday_start" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "thursday_end" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "thursday_break" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "friday_start" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "friday_end" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "friday_break" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "saturday_start" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "saturday_end" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "saturday_break" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "sunday_start" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "sunday_end" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "sunday_break" text;--> statement-breakpoint
ALTER TABLE "employee_form" DROP COLUMN IF EXISTS "restday";
