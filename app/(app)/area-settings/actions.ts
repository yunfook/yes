"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { areaSetting } from "@/db/schema";
import { requireSession, assertCanAccessArea } from "@/lib/authz";

const TimeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24-hour)");

const Schema = z.object({
  otRate: z.number().nonnegative(),
  rdRate: z.number().nonnegative(),
  phRate: z.number().nonnegative(),
  hoursPerWeek: z.number().positive(),
  daysPerMonth: z.number().positive(),
  workStart: TimeString,
  workEnd: TimeString,
});

export type AreaSettingValues = z.infer<typeof Schema>;

const AREA_SETTING_DEFAULTS: AreaSettingValues = {
  otRate: 1.5,
  rdRate: 2,
  phRate: 3,
  hoursPerWeek: 45,
  daysPerMonth: 24,
  workStart: "07:00",
  workEnd: "16:00",
};

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
      hoursPerWeek: areaSetting.hoursPerWeek,
      daysPerMonth: areaSetting.daysPerMonth,
      workStart: areaSetting.workStart,
      workEnd: areaSetting.workEnd,
    })
    .from(areaSetting)
    .where(eq(areaSetting.areaId, areaId))
    .limit(1);
  return row ?? AREA_SETTING_DEFAULTS;
}

export async function updateAreaSetting(
  areaId: number,
  input: AreaSettingValues,
) {
  const session = await requireSession();
  await assertCanAccessArea(session, areaId);
  const data = Schema.parse(input);
  if (data.workStart >= data.workEnd) {
    throw new Error("Working end time must be later than start time");
  }
  await db
    .insert(areaSetting)
    .values({ areaId, ...data })
    .onConflictDoUpdate({ target: areaSetting.areaId, set: data });
}
