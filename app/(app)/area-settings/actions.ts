"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { areaSetting } from "@/db/schema";
import { requireSession, assertCanAccessArea } from "@/lib/authz";

const Schema = z.object({
  otRate: z.number().nonnegative(),
  rdRate: z.number().nonnegative(),
  phRate: z.number().nonnegative(),
});

export type AreaSettingValues = z.infer<typeof Schema>;

export async function getAreaSetting(
  areaId: number,
): Promise<AreaSettingValues> {
  const session = await requireSession();
  await assertCanAccessArea(session, areaId);
  const [row] = await db
    .select({
      otRate: areaSetting.otRate,
      rdRate: areaSetting.rdRate,
      phRate: areaSetting.phRate,
    })
    .from(areaSetting)
    .where(eq(areaSetting.areaId, areaId))
    .limit(1);
  return row ?? { otRate: 1.5, rdRate: 2, phRate: 3 };
}

export async function updateAreaSetting(
  areaId: number,
  input: AreaSettingValues,
) {
  const session = await requireSession();
  await assertCanAccessArea(session, areaId);
  const data = Schema.parse(input);
  await db
    .insert(areaSetting)
    .values({ areaId, ...data })
    .onConflictDoUpdate({ target: areaSetting.areaId, set: data });
  revalidatePath("/area-settings");
}
