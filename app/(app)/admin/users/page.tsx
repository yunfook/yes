import { db } from "@/db";
import { users, userAreas, areas } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { requireAdmin } from "@/lib/authz";
import { UsersTable } from "./users-table";

export default async function UsersAdminPage() {
  await requireAdmin();

  const allUsers = await db
    .select()
    .from(users)
    .where(isNull(users.deletedAt))
    .orderBy(users.email);
  const allAreas = await db
    .select()
    .from(areas)
    .where(isNull(areas.deletedAt))
    .orderBy(areas.name);

  const assignmentRows = await db
    .select({
      userId: userAreas.userId,
      areaId: userAreas.areaId,
      areaName: areas.name,
    })
    .from(userAreas)
    .innerJoin(
      areas,
      and(eq(areas.id, userAreas.areaId), isNull(areas.deletedAt)),
    );

  const assignmentsByUser = new Map<number, { id: number; name: string }[]>();
  for (const row of assignmentRows) {
    const list = assignmentsByUser.get(row.userId) ?? [];
    list.push({ id: row.areaId, name: row.areaName });
    assignmentsByUser.set(row.userId, list);
  }

  const items = allUsers.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    isAdmin: u.isAdmin,
    areas: assignmentsByUser.get(u.id) ?? [],
  }));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">
          Super admins see every area. Other users only see their assigned areas.
        </p>
      </div>
      <UsersTable
        items={items}
        areas={allAreas.map((a) => ({ id: a.id, name: a.name }))}
      />
    </div>
  );
}
