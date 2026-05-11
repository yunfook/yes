"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { areaSetting, payMultiplier } from "@/db/schema";
import { requireSession, assertCanAccessArea } from "@/lib/authz";

const TimeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24-hour)");

const Schema = z.object({
  hoursPerWeek: z.number().positive(),
  daysPerMonth: z.number().positive(),
  workStart: TimeString,
  workEnd: TimeString,
});

export type AreaSettingValues = z.infer<typeof Schema>;

const AREA_SETTING_DEFAULTS: AreaSettingValues = {
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

export type PayMultiplierValues = {
  hasOt: boolean;
  otRate: number;
  hasRd: boolean;
  rdRate: number;
  hasPh: boolean;
  phRate: number;
  hasDbl: boolean;
  hasTpl: boolean;
};

const PAY_MULTIPLIER_DEFAULTS: PayMultiplierValues = {
  hasOt: true,
  otRate: 1.5,
  hasRd: true,
  rdRate: 2,
  hasPh: true,
  phRate: 3,
  hasDbl: false,
  hasTpl: false,
};

export async function getPayMultiplier(
  areaId: number,
): Promise<PayMultiplierValues> {
  const session = await requireSession();
  await assertCanAccessArea(session, areaId);
  const [row] = await db
    .select({
      hasOt: payMultiplier.hasOt,
      otRate: payMultiplier.otRate,
      hasRd: payMultiplier.hasRd,
      rdRate: payMultiplier.rdRate,
      hasPh: payMultiplier.hasPh,
      phRate: payMultiplier.phRate,
      hasDbl: payMultiplier.hasDbl,
      hasTpl: payMultiplier.hasTpl,
    })
    .from(payMultiplier)
    .where(eq(payMultiplier.areaId, areaId))
    .limit(1);
  return row ?? PAY_MULTIPLIER_DEFAULTS;
}

const PayMultiplierUpdateSchema = z.object({
  hasOt: z.boolean(),
  hasRd: z.boolean(),
  hasPh: z.boolean(),
  hasDbl: z.boolean(),
  hasTpl: z.boolean(),
  otRate: z.number().nonnegative(),
  rdRate: z.number().nonnegative(),
  phRate: z.number().nonnegative(),
});

export type PayMultiplierUpdate = z.infer<typeof PayMultiplierUpdateSchema>;

export async function updatePayMultiplier(
  areaId: number,
  input: PayMultiplierUpdate,
) {
  const session = await requireSession();
  await assertCanAccessArea(session, areaId);
  const data = PayMultiplierUpdateSchema.parse(input);
  await db
    .insert(payMultiplier)
    .values({ areaId, ...data })
    .onConflictDoUpdate({ target: payMultiplier.areaId, set: data });
}
