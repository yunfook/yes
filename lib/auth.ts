import "server-only";
import { hash, verify } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function hashPassword(plain: string) {
  return hash(plain);
}

export async function verifyCredentials(email: string, password: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1);
  if (!user) return null;
  const ok = await verify(user.passwordHash, password);
  if (!ok) return null;
  return user;
}
