import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { SignJWT } from "jose";
import * as schema from "./schema";

const email = process.argv[2] ?? "admin@local";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);
  if (!user) throw new Error(`No user ${email}`);
  const key = new TextEncoder().encode(
    process.env.SESSION_SECRET ?? "dev-only-fallback-change-me",
  );
  const token = await new SignJWT({
    userId: user.id,
    email: user.email,
    name: user.name,
    isAdmin: user.isAdmin,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
  console.log(token);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
