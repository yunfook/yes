import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });
  const users = await db.select().from(schema.users);
  console.table(users.map((u) => ({ id: u.id, email: u.email, isAdmin: u.isAdmin })));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
