CREATE TABLE "area_setting" (
	"area_id" integer PRIMARY KEY NOT NULL,
	"ot_rate" real DEFAULT 1.5 NOT NULL,
	"rd_rate" real DEFAULT 2 NOT NULL,
	"ph_rate" real DEFAULT 3 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "area_setting" ADD CONSTRAINT "area_setting_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
INSERT INTO "area_setting" ("area_id") SELECT "id" FROM "areas" ON CONFLICT DO NOTHING;