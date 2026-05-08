ALTER TABLE "employees" ALTER COLUMN "has_overtime" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "has_overtime" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "has_restday" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "has_restday" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "has_holiday" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "has_holiday" DROP NOT NULL;--> statement-breakpoint
UPDATE "employees" SET "has_overtime" = NULL, "has_restday" = NULL, "has_holiday" = NULL WHERE "salary_type" IS NULL;
