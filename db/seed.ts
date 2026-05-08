import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { hash } from "@node-rs/argon2";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function main() {
  console.log("Seeding…");

  const adminPasswordHash = await hash("admin123");

  await db
    .insert(schema.users)
    .values({
      email: "admin@yunfook.com.my",
      name: "Super Admin",
      passwordHash: adminPasswordHash,
      isAdmin: true,
    })
    .onConflictDoNothing({ target: schema.users.email })
    .returning();

  const userPasswordHash = await hash("user123");

  const [areaUser] = await db
    .insert(schema.users)
    .values({
      email: "alice@local",
      name: "Alice (Area North only)",
      passwordHash: userPasswordHash,
      isAdmin: false,
    })
    .onConflictDoNothing({ target: schema.users.email })
    .returning();

  const insertedAreas = await db
    .insert(schema.areas)
    .values([{ name: "North" }, { name: "South" }, { name: "East" }])
    .returning();

  const north = insertedAreas.find((a) => a.name === "North");
  const south = insertedAreas.find((a) => a.name === "South");

  if (areaUser && north) {
    await db
      .insert(schema.userAreas)
      .values({ userId: areaUser.id, areaId: north.id })
      .onConflictDoNothing();
  }

  if (north && south) {
    const insertedPositions = await db
      .insert(schema.positions)
      .values([
        { name: "Manager", areaId: north.id },
        { name: "Engineer", areaId: north.id },
        { name: "Sales", areaId: south.id },
      ])
      .returning();

    const managerNorth = insertedPositions.find(
      (p) => p.name === "Manager" && p.areaId === north.id,
    );

    if (managerNorth) {
      await db.insert(schema.employees).values([
        {
          name: "John Doe",
          areaId: north.id,
          dob: "1990-05-12",
          gender: "Male",
          positionId: managerNorth.id,
          ic: "900512-10-1234",
          nationality: "Local",
        },
        {
          name: "Jane Smith",
          areaId: north.id,
          dob: "1992-08-20",
          gender: "Female",
          positionId: managerNorth.id,
          passport: "P12345678",
          nationality: "International",
        },
      ]);
    }
  }

  console.log("Seed complete:");
  console.log("  admin@yunfook.com.my / admin123  (super admin)");
  console.log("  alice@local / user123   (area: North only)");
  console.log("  Areas:", insertedAreas.map((a) => a.name).join(", "));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
