import "server-only";
import { redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { userAreas, areas } from "@/db/schema";
import { getSession, type SessionPayload } from "./session";

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireSession();
  if (!session.isAdmin) redirect("/dashboard");
  return session;
}

export async function getAccessibleAreas(session: SessionPayload) {
  if (session.isAdmin) {
    return db
      .select()
      .from(areas)
      .where(isNull(areas.deletedAt))
      .orderBy(areas.name);
  }
  return db
    .select({ id: areas.id, name: areas.name, createdAt: areas.createdAt })
    .from(areas)
    .innerJoin(userAreas, eq(userAreas.areaId, areas.id))
    .where(and(eq(userAreas.userId, session.userId), isNull(areas.deletedAt)))
    .orderBy(areas.name);
}

export async function canAccessArea(
  session: SessionPayload,
  areaId: number,
): Promise<boolean> {
  if (session.isAdmin) return true;
  const rows = await db
    .select({ areaId: userAreas.areaId })
    .from(userAreas)
    .where(and(eq(userAreas.userId, session.userId), eq(userAreas.areaId, areaId)))
    .limit(1);
  return rows.length > 0;
}

export async function assertCanAccessArea(
  session: SessionPayload,
  areaId: number,
): Promise<void> {
  const ok = await canAccessArea(session, areaId);
  if (!ok) throw new Error("Forbidden: no access to this area");
}
