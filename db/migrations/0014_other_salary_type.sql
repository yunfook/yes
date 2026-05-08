CREATE TABLE IF NOT EXISTS "other_salary_type" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "area_id" integer NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp
);--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "other_salary_type" ADD CONSTRAINT "other_salary_type_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "other_salary_type_id" integer;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "employees" ADD CONSTRAINT "employees_other_salary_type_id_other_salary_type_id_fk" FOREIGN KEY ("other_salary_type_id") REFERENCES "public"."other_salary_type"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
ALTER TABLE "employees" DROP COLUMN IF EXISTS "salary_other";
