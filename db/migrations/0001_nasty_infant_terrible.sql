CREATE TABLE "employee_form" (
	"area_id" integer PRIMARY KEY NOT NULL,
	"dob" boolean DEFAULT false NOT NULL,
	"gender" boolean DEFAULT false NOT NULL,
	"positions" boolean DEFAULT false NOT NULL,
	"nationality" boolean DEFAULT false NOT NULL,
	"ic" boolean DEFAULT false NOT NULL,
	"passport" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "employee_form" ADD CONSTRAINT "employee_form_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
INSERT INTO "employee_form" ("area_id") SELECT "id" FROM "areas" ON CONFLICT DO NOTHING;