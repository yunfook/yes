"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq, and, count, isNull } from "drizzle-orm";
import { db } from "@/db";
import { departments, employees } from "@/db/schema";
import { requireSession, assertCanAccessArea } from "@/lib/authz";

export type DepartmentWithCount = {
  id: number;
  name: string;
  employeeCount: number;
};

export async function listDepartmentsWithCount(
  areaId: number,
): Promise<DepartmentWithCount[]> {
  const session = await requireSession();
  await assertCanAccessArea(session, areaId);
  const rows = await db
    .select({
      id: departments.id,
      name: departments.name,
      employeeCount: count(employees.id),
    })
    .from(departments)
    .leftJoin(
      employees,
      and(
        eq(employees.departmentId, departments.id),
        isNull(employees.deletedAt),
      ),
    )
    .where(and(eq(departments.areaId, areaId), isNull(departments.deletedAt)))
    .groupBy(departments.id, departments.name)
    .orderBy(departments.name);
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

export async function createDepartment(input: z.infer<typeof Schema>) {
  const session = await requireSession();
  const data = Schema.parse(input);
  await assertCanAccessArea(session, data.areaId);

  const [duplicate] = await db
    .select({ id: departments.id })
    .from(departments)
    .where(
      and(
        eq(departments.name, data.name),
        eq(departments.areaId, data.areaId),
        isNull(departments.deletedAt),
      ),
    )
    .limit(1);
  if (duplicate) {
    throw new Error("A department with this name already exists in this area");
  }

  await db.insert(departments).values({ name: data.name, areaId: data.areaId });
  revalidatePath("/employees");
  revalidatePath("/employees/new");
}

export async function updateDepartment(
  id: number,
  input: z.infer<typeof Schema>,
) {
  const session = await requireSession();
  const data = Schema.parse(input);
  await assertCanAccessArea(session, data.areaId);

  const [existing] = await db
    .select({ areaId: departments.areaId })
    .from(departments)
    .where(and(eq(departments.id, id), isNull(departments.deletedAt)))
    .limit(1);
  if (!existing) throw new Error("Not found");
  await assertCanAccessArea(session, existing.areaId);

  const [duplicate] = await db
    .select({ id: departments.id })
    .from(departments)
    .where(
      and(
        eq(departments.name, data.name),
        eq(departments.areaId, data.areaId),
        isNull(departments.deletedAt),
      ),
    )
    .limit(1);
  if (duplicate && duplicate.id !== id) {
    throw new Error("A department with this name already exists in this area");
  }

  await db
    .update(departments)
    .set({ name: data.name, areaId: data.areaId })
    .where(eq(departments.id, id));
  revalidatePath("/employees");
  revalidatePath("/employees/new");
}

export async function deleteDepartment(id: number) {
  const session = await requireSession();
  const [existing] = await db
    .select({ areaId: departments.areaId })
    .from(departments)
    .where(and(eq(departments.id, id), isNull(departments.deletedAt)))
    .limit(1);
  if (!existing) return;
  await assertCanAccessArea(session, existing.areaId);
  await db
    .update(departments)
    .set({ deletedAt: new Date() })
    .where(
      and(eq(departments.id, id), eq(departments.areaId, existing.areaId)),
    );
  revalidatePath("/employees");
  revalidatePath("/employees/new");
}
