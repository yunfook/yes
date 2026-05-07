"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { positions } from "@/db/schema";
import { requireSession, assertCanAccessArea } from "@/lib/authz";

const Schema = z.object({
  name: z.string().trim().min(1).max(120),
  areaId: z.number().int().positive(),
});

export async function createPosition(input: z.infer<typeof Schema>) {
  const session = await requireSession();
  const data = Schema.parse(input);
  await assertCanAccessArea(session, data.areaId);
  await db.insert(positions).values({ name: data.name, areaId: data.areaId });
  revalidatePath("/positions");
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
    .where(eq(positions.id, id))
    .limit(1);
  if (!existing) throw new Error("Not found");
  await assertCanAccessArea(session, existing.areaId);

  await db
    .update(positions)
    .set({ name: data.name, areaId: data.areaId })
    .where(eq(positions.id, id));
  revalidatePath("/positions");
}

export async function deletePosition(id: number) {
  const session = await requireSession();
  const [existing] = await db
    .select({ areaId: positions.areaId })
    .from(positions)
    .where(eq(positions.id, id))
    .limit(1);
  if (!existing) return;
  await assertCanAccessArea(session, existing.areaId);
  await db
    .delete(positions)
    .where(and(eq(positions.id, id), eq(positions.areaId, existing.areaId)));
  revalidatePath("/positions");
}
