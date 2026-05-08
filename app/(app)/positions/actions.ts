"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq, and, count, isNull } from "drizzle-orm";
import { db } from "@/db";
import { positions, employees } from "@/db/schema";
import { requireSession, assertCanAccessArea } from "@/lib/authz";

export type PositionWithCount = {
  id: number;
  name: string;
  employeeCount: number;
};

export async function listPositionsWithCount(
  areaId: number,
): Promise<PositionWithCount[]> {
  const session = await requireSession();
  await assertCanAccessArea(session, areaId);
  const rows = await db
    .select({
      id: positions.id,
      name: positions.name,
      employeeCount: count(employees.id),
    })
    .from(positions)
    .leftJoin(
      employees,
      and(
        eq(employees.positionId, positions.id),
        isNull(employees.deletedAt),
      ),
    )
    .where(and(eq(positions.areaId, areaId), isNull(positions.deletedAt)))
    .groupBy(positions.id, positions.name)
    .orderBy(positions.name);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    employeeCount: Number(r.employeeCount ?? 0),
  }));
}

const Schema = z.object({
  name: z.string().trim().min(1).max(120),
  areaId: z.number().int().positive(),
});

export async function createPosition(input: z.infer<typeof Schema>) {
  const session = await requireSession();
  const data = Schema.parse(input);
  await assertCanAccessArea(session, data.areaId);

  const [duplicate] = await db
    .select({ id: positions.id })
    .from(positions)
    .where(
      and(
        eq(positions.name, data.name),
        eq(positions.areaId, data.areaId),
        isNull(positions.deletedAt),
      ),
    )
    .limit(1);
  if (duplicate) {
    throw new Error("A position with this name already exists in this area");
  }

  await db.insert(positions).values({ name: data.name, areaId: data.areaId });
  revalidatePath("/employees");
  revalidatePath("/employees/new");
}

export async function updatePosition(
  id: number,
  input: z.infer<typeof Schema>,
) {
  const session = await requireSession();
  const data = Schema.parse(input);
  await assertCanAccessArea(session, data.areaId);

  const [existing] = await db
    .select({ areaId: positions.areaId })
    .from(positions)
    .where(and(eq(positions.id, id), isNull(positions.deletedAt)))
    .limit(1);
  if (!existing) throw new Error("Not found");
  await assertCanAccessArea(session, existing.areaId);

  const [duplicate] = await db
    .select({ id: positions.id })
    .from(positions)
    .where(
      and(
        eq(positions.name, data.name),
        eq(positions.areaId, data.areaId),
        isNull(positions.deletedAt),
      ),
    )
    .limit(1);
  if (duplicate && duplicate.id !== id) {
    throw new Error("A position with this name already exists in this area");
  }

  await db
    .update(positions)
    .set({ name: data.name, areaId: data.areaId })
    .where(eq(positions.id, id));
  revalidatePath("/employees");
  revalidatePath("/employees/new");
}

export async function deletePosition(id: number) {
  const session = await requireSession();
  const [existing] = await db
    .select({ areaId: positions.areaId })
    .from(positions)
    .where(and(eq(positions.id, id), isNull(positions.deletedAt)))
    .limit(1);
  if (!existing) return;
  await assertCanAccessArea(session, existing.areaId);
  await db
    .update(positions)
    .set({ deletedAt: new Date() })
    .where(and(eq(positions.id, id), eq(positions.areaId, existing.areaId)));
  revalidatePath("/employees");
  revalidatePath("/employees/new");
}
