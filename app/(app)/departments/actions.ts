"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { departments } from "@/db/schema";
import { requireSession, assertCanAccessArea } from "@/lib/authz";

const Schema = z.object({
  name: z.string().trim().min(1).max(120),
  areaId: z.number().int().positive(),
});

export async function createDepartment(input: z.infer<typeof Schema>) {
  const session = await requireSession();
  const data = Schema.parse(input);
  await assertCanAccessArea(session, data.areaId);
  await db.insert(departments).values({ name: data.name, areaId: data.areaId });
  revalidatePath("/departments");
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
    .where(eq(departments.id, id))
    .limit(1);
  if (!existing) throw new Error("Not found");
  await assertCanAccessArea(session, existing.areaId);

  await db
    .update(departments)
    .set({ name: data.name, areaId: data.areaId })
    .where(eq(departments.id, id));
  revalidatePath("/departments");
}

export async function deleteDepartment(id: number) {
  const session = await requireSession();
  const [existing] = await db
    .select({ areaId: departments.areaId })
    .from(departments)
    .where(eq(departments.id, id))
    .limit(1);
  if (!existing) return;
  await assertCanAccessArea(session, existing.areaId);
  await db
    .delete(departments)
    .where(
      and(eq(departments.id, id), eq(departments.areaId, existing.areaId)),
    );
  revalidatePath("/departments");
}
