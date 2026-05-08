"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq, and, count, isNull } from "drizzle-orm";
import { db } from "@/db";
import { otherSalaryType, employees } from "@/db/schema";
import { requireSession, assertCanAccessArea } from "@/lib/authz";

export type SalaryTypeWithCount = {
  id: number;
  name: string;
  employeeCount: number;
};

export type SalaryTypeListItem = {
  id: number | null;
  name: string;
  employeeCount: number;
  builtIn: boolean;
};

export async function listSalaryTypesWithCount(
  areaId: number,
): Promise<SalaryTypeWithCount[]> {
  const session = await requireSession();
  await assertCanAccessArea(session, areaId);
  const rows = await db
    .select({
      id: otherSalaryType.id,
      name: otherSalaryType.name,
      employeeCount: count(employees.id),
    })
    .from(otherSalaryType)
    .leftJoin(
      employees,
      and(
        eq(employees.otherSalaryTypeId, otherSalaryType.id),
        isNull(employees.deletedAt),
      ),
    )
    .where(
      and(
        eq(otherSalaryType.areaId, areaId),
        isNull(otherSalaryType.deletedAt),
      ),
    )
    .groupBy(otherSalaryType.id, otherSalaryType.name)
    .orderBy(otherSalaryType.name);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    employeeCount: Number(r.employeeCount ?? 0),
  }));
}

export async function listAllSalaryTypesWithCount(
  areaId: number,
): Promise<SalaryTypeListItem[]> {
  const session = await requireSession();
  await assertCanAccessArea(session, areaId);

  const builtInRows = await db
    .select({
      type: employees.salaryType,
      employeeCount: count(employees.id),
    })
    .from(employees)
    .where(
      and(
        eq(employees.areaId, areaId),
        isNull(employees.deletedAt),
      ),
    )
    .groupBy(employees.salaryType);

  const counts: Record<string, number> = {};
  for (const r of builtInRows) {
    if (r.type) counts[r.type] = Number(r.employeeCount ?? 0);
  }

  const otherRows = await db
    .select({
      id: otherSalaryType.id,
      name: otherSalaryType.name,
      employeeCount: count(employees.id),
    })
    .from(otherSalaryType)
    .leftJoin(
      employees,
      and(
        eq(employees.otherSalaryTypeId, otherSalaryType.id),
        isNull(employees.deletedAt),
      ),
    )
    .where(
      and(
        eq(otherSalaryType.areaId, areaId),
        isNull(otherSalaryType.deletedAt),
      ),
    )
    .groupBy(otherSalaryType.id, otherSalaryType.name)
    .orderBy(otherSalaryType.name);

  return [
    {
      id: null,
      name: "Hour rate",
      employeeCount: counts.hour ?? 0,
      builtIn: true,
    },
    {
      id: null,
      name: "Monthly paid",
      employeeCount: counts.monthly ?? 0,
      builtIn: true,
    },
    ...otherRows.map((r) => ({
      id: r.id,
      name: r.name,
      employeeCount: Number(r.employeeCount ?? 0),
      builtIn: false,
    })),
  ];
}

export async function listSalaryTypesByArea(areaId: number) {
  const session = await requireSession();
  await assertCanAccessArea(session, areaId);
  return db
    .select({ id: otherSalaryType.id, name: otherSalaryType.name })
    .from(otherSalaryType)
    .where(
      and(
        eq(otherSalaryType.areaId, areaId),
        isNull(otherSalaryType.deletedAt),
      ),
    )
    .orderBy(otherSalaryType.name);
}

const Schema = z.object({
  name: z.string().trim().min(1).max(120),
  areaId: z.number().int().positive(),
});

export async function createSalaryType(input: z.infer<typeof Schema>) {
  const session = await requireSession();
  const data = Schema.parse(input);
  await assertCanAccessArea(session, data.areaId);

  const [duplicate] = await db
    .select({ id: otherSalaryType.id })
    .from(otherSalaryType)
    .where(
      and(
        eq(otherSalaryType.name, data.name),
        eq(otherSalaryType.areaId, data.areaId),
        isNull(otherSalaryType.deletedAt),
      ),
    )
    .limit(1);
  if (duplicate) {
    throw new Error("A salary type with this name already exists in this area");
  }

  await db
    .insert(otherSalaryType)
    .values({ name: data.name, areaId: data.areaId });
  revalidatePath("/employees");
  revalidatePath("/employees/new");
}

export async function updateSalaryType(
  id: number,
  input: z.infer<typeof Schema>,
) {
  const session = await requireSession();
  const data = Schema.parse(input);
  await assertCanAccessArea(session, data.areaId);

  const [existing] = await db
    .select({ areaId: otherSalaryType.areaId })
    .from(otherSalaryType)
    .where(and(eq(otherSalaryType.id, id), isNull(otherSalaryType.deletedAt)))
    .limit(1);
  if (!existing) throw new Error("Not found");
  await assertCanAccessArea(session, existing.areaId);

  const [duplicate] = await db
    .select({ id: otherSalaryType.id })
    .from(otherSalaryType)
    .where(
      and(
        eq(otherSalaryType.name, data.name),
        eq(otherSalaryType.areaId, data.areaId),
        isNull(otherSalaryType.deletedAt),
      ),
    )
    .limit(1);
  if (duplicate && duplicate.id !== id) {
    throw new Error("A salary type with this name already exists in this area");
  }

  await db
    .update(otherSalaryType)
    .set({ name: data.name, areaId: data.areaId })
    .where(eq(otherSalaryType.id, id));
  revalidatePath("/employees");
  revalidatePath("/employees/new");
}

export async function deleteSalaryType(id: number) {
  const session = await requireSession();
  const [existing] = await db
    .select({ areaId: otherSalaryType.areaId })
    .from(otherSalaryType)
    .where(and(eq(otherSalaryType.id, id), isNull(otherSalaryType.deletedAt)))
    .limit(1);
  if (!existing) return;
  await assertCanAccessArea(session, existing.areaId);
  await db
    .update(otherSalaryType)
    .set({ deletedAt: new Date() })
    .where(eq(otherSalaryType.id, id));
  revalidatePath("/employees");
  revalidatePath("/employees/new");
}
