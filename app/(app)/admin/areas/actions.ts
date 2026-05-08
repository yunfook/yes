"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { areas, employeeForm, areaSetting } from "@/db/schema";
import { requireAdmin } from "@/lib/authz";

const AreaSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

export async function createArea(input: z.infer<typeof AreaSchema>) {
  await requireAdmin();
  const data = AreaSchema.parse(input);
  const [area] = await db
    .insert(areas)
    .values({ name: data.name })
    .returning({ id: areas.id });
  await db.insert(employeeForm).values({ areaId: area.id });
  await db.insert(areaSetting).values({
    areaId: area.id,
    hoursPerWeek: 45,
    daysPerMonth: 24,
  });
  revalidatePath("/admin/areas");
}

export async function updateArea(id: number, input: z.infer<typeof AreaSchema>) {
  await requireAdmin();
  const data = AreaSchema.parse(input);
  await db.update(areas).set({ name: data.name }).where(eq(areas.id, id));
  revalidatePath("/admin/areas");
}

export async function deleteArea(id: number) {
  await requireAdmin();
  await db.update(areas).set({ deletedAt: new Date() }).where(eq(areas.id, id));
  revalidatePath("/admin/areas");
}
