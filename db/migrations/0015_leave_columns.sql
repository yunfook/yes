ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "total_annual_leave" integer;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "total_sick_leave" integer;--> statement-breakpoint
ALTER TABLE "employee_form" ADD COLUMN IF NOT EXISTS "total_annual_leave" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "employee_form" ADD COLUMN IF NOT EXISTS "total_sick_leave" boolean DEFAULT false NOT NULL;
