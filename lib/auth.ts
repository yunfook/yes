import "server-only";
import { hash, verify } from "@node-rs/argon2";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { usernameToEmail } from "@/lib/user-email";

export async function hashPassword(plain: string) {
  return hash(plain);
}

export async function verifyCredentials(username: string, password: string) {
  const email = usernameToEmail(username);
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), isNull(users.deletedAt)))
    .limit(1);
  if (!user) return null;
  const ok = await verify(user.passwordHash, password);
  if (!ok) return null;
  return user;
}
