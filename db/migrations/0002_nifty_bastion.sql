ALTER TABLE "employee_form" ADD COLUMN "restday" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "restday" text[];