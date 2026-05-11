import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { userAreas, areas } from "@/db/schema";
import { getSession, type SessionPayload } from "./session";

export const requireSession = cache(async (): Promise<SessionPayload> => {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
});

export const requireAdmin = cache(async (): Promise<SessionPayload> => {
  const session = await requireSession();
  if (!session.isAdmin) redirect("/dashboard");
  return session;
});

const getAccessibleAreasForUser = cache(
  async (userId: number, isAdmin: boolean) => {
    if (isAdmin) {
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
      .where(and(eq(userAreas.userId, userId), isNull(areas.deletedAt)))
      .orderBy(areas.name);
  },
);

export function getAccessibleAreas(session: SessionPayload) {
  return getAccessibleAreasForUser(session.userId, session.isAdmin);
}

const canAccessAreaForUser = cache(
  async (userId: number, isAdmin: boolean, areaId: number) => {
    if (isAdmin) return true;
    const rows = await db
      .select({ areaId: userAreas.areaId })
      .from(userAreas)
      .where(and(eq(userAreas.userId, userId), eq(userAreas.areaId, areaId)))
      .limit(1);
    return rows.length > 0;
  },
);

export function canAccessArea(
  session: SessionPayload,
  areaId: number,
): Promise<boolean> {
  return canAccessAreaForUser(session.userId, session.isAdmin, areaId);
}

export async function assertCanAccessArea(
  session: SessionPayload,
  areaId: number,
): Promise<void> {
  const ok = await canAccessArea(session, areaId);
  if (!ok) throw new Error("Forbidden: no access to this area");
}
