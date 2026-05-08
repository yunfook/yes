"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  employees,
  employeeForm,
  positions,
  departments,
  areaSetting,
  otherSalaryType,
} from "@/db/schema";
import { requireSession, assertCanAccessArea } from "@/lib/authz";

import { RESTDAY_VALUES, type RestdayValue } from "./restday";

const NullishStr = z.string().trim().min(1).nullable();

const SalarySchema = z
  .object({
    type: z.enum(["hour", "monthly", "other"]),
    hour: z.number().nonnegative().nullable(),
    day: z.number().nonnegative().nullable(),
    week: z.number().nonnegative().nullable(),
    month: z.number().nonnegative().nullable(),
    otherTypeId: z.number().int().positive().nullable(),
    hasOvertime: z.boolean(),
    hasRestday: z.boolean(),
    hasHoliday: z.boolean(),
  })
  .nullable();

const DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
type DayKey = (typeof DAY_KEYS)[number];

const DayScheduleSchema = z.object({
  workStart: z.string().regex(/^\d{2}:\d{2}$/),
  workEnd: z.string().regex(/^\d{2}:\d{2}$/),
  breakStart: z.string().regex(/^\d{2}:\d{2}$/),
  breakEnabled: z.boolean(),
});

const ScheduleSchema = z
  .object({
    restday: z.array(z.enum(RESTDAY_VALUES)).min(1),
    breakType: z.enum(["30m", "1h", "2h", "none"]),
    days: z.object({
      monday: DayScheduleSchema,
      tuesday: DayScheduleSchema,
      wednesday: DayScheduleSchema,
      thursday: DayScheduleSchema,
      friday: DayScheduleSchema,
      saturday: DayScheduleSchema,
      sunday: DayScheduleSchema,
    }),
  })
  .nullable();

const Schema = z
  .object({
    name: z.string().trim().min(1).max(120),
    dob: NullishStr,
    gender: z.enum(["Male", "Female"]).nullable(),
    positionId: z.number().int().positive().nullable(),
    departmentId: z.number().int().positive().nullable(),
    ic: NullishStr,
    passport: NullishStr,
    nationality: z.enum(["Local", "International"]).nullable(),
    contactNumber: NullishStr,
    email: NullishStr,
    totalAnnualLeave: z.number().int().nonnegative().nullable(),
    totalSickLeave: z.number().int().nonnegative().nullable(),
    schedule: ScheduleSchema,
    salary: SalarySchema,
  })
  .refine((d) => !(d.nationality === "International" && d.ic !== null), {
    message: "International employees can't have an Identity Card",
    path: ["ic"],
  });

export type EmployeeFormValues = z.infer<typeof Schema>;

export type EmployeeRow = {
  id: number;
  areaId: number | null;
  name: string;
  dob: string | null;
  gender: "Male" | "Female" | null;
  positionId: number | null;
  positionName: string | null;
  departmentId: number | null;
  departmentName: string | null;
  ic: string | null;
  passport: string | null;
  nationality: "Local" | "International" | null;
  contactNumber: string | null;
  email: string | null;
  totalAnnualLeave: number | null;
  totalSickLeave: number | null;
  restday: RestdayValue[] | null;
  breakType: "30m" | "1h" | "2h" | "none" | null;
  mondayStart: string | null;
  mondayEnd: string | null;
  mondayBreak: string | null;
  tuesdayStart: string | null;
  tuesdayEnd: string | null;
  tuesdayBreak: string | null;
  wednesdayStart: string | null;
  wednesdayEnd: string | null;
  wednesdayBreak: string | null;
  thursdayStart: string | null;
  thursdayEnd: string | null;
  thursdayBreak: string | null;
  fridayStart: string | null;
  fridayEnd: string | null;
  fridayBreak: string | null;
  saturdayStart: string | null;
  saturdayEnd: string | null;
  saturdayBreak: string | null;
  sundayStart: string | null;
  sundayEnd: string | null;
  sundayBreak: string | null;
  salaryType: "hour" | "monthly" | "other" | null;
  salaryHour: number | null;
  salaryDay: number | null;
  salaryWeek: number | null;
  salaryMonth: number | null;
  otherSalaryTypeId: number | null;
  otherSalaryTypeName: string | null;
  hasOvertime: boolean | null;
  hasRestday: boolean | null;
  hasHoliday: boolean | null;
};

export async function listEmployeesByArea(areaId: number): Promise<EmployeeRow[]> {
  const session = await requireSession();
  await assertCanAccessArea(session, areaId);

  const rows = await db
    .select({
      id: employees.id,
      areaId: employees.areaId,
      name: employees.name,
      dob: employees.dob,
      gender: employees.gender,
      positionId: employees.positionId,
      positionName: positions.name,
      departmentId: employees.departmentId,
      departmentName: departments.name,
      ic: employees.ic,
      passport: employees.passport,
      nationality: employees.nationality,
      contactNumber: employees.contactNumber,
      email: employees.email,
      restday: employees.restday,
      salaryType: employees.salaryType,
      salaryHour: employees.salaryHour,
      salaryDay: employees.salaryDay,
      salaryWeek: employees.salaryWeek,
      salaryMonth: employees.salaryMonth,
      otherSalaryTypeId: employees.otherSalaryTypeId,
      otherSalaryTypeName: otherSalaryType.name,
      hasOvertime: employees.hasOvertime,
      hasRestday: employees.hasRestday,
      hasHoliday: employees.hasHoliday,
    })
    .from(employees)
    .leftJoin(positions, eq(positions.id, employees.positionId))
    .leftJoin(departments, eq(departments.id, employees.departmentId))
    .leftJoin(
      otherSalaryType,
      eq(otherSalaryType.id, employees.otherSalaryTypeId),
    )
    .where(and(eq(employees.areaId, areaId), isNull(employees.deletedAt)))
    .orderBy(employees.name);

  return rows as EmployeeRow[];
}

async function assertPositionInArea(positionId: number, areaId: number) {
  const [row] = await db
    .select({ areaId: positions.areaId })
    .from(positions)
    .where(and(eq(positions.id, positionId), isNull(positions.deletedAt)))
    .limit(1);
  if (!row || row.areaId !== areaId) {
    throw new Error("Position does not belong to this area");
  }
}

async function assertDepartmentInArea(departmentId: number, areaId: number) {
  const [row] = await db
    .select({ areaId: departments.areaId })
    .from(departments)
    .where(and(eq(departments.id, departmentId), isNull(departments.deletedAt)))
    .limit(1);
  if (!row || row.areaId !== areaId) {
    throw new Error("Department does not belong to this area");
  }
}

function scheduleColumns(
  schedule: NonNullable<EmployeeFormValues["schedule"]> | null,
) {
  const get = (day: DayKey) => {
    if (!schedule) return { start: null, end: null, brk: null };
    const d = schedule.days[day];
    const breakOff = schedule.breakType === "none" || !d.breakEnabled;
    return {
      start: d.workStart,
      end: d.workEnd,
      brk: breakOff ? null : d.breakStart,
    };
  };
  const m = get("monday");
  const tu = get("tuesday");
  const w = get("wednesday");
  const th = get("thursday");
  const f = get("friday");
  const sa = get("saturday");
  const su = get("sunday");
  return {
    restday: schedule?.restday ?? null,
    breakType: schedule?.breakType ?? null,
    mondayStart: m.start,
    mondayEnd: m.end,
    mondayBreak: m.brk,
    tuesdayStart: tu.start,
    tuesdayEnd: tu.end,
    tuesdayBreak: tu.brk,
    wednesdayStart: w.start,
    wednesdayEnd: w.end,
    wednesdayBreak: w.brk,
    thursdayStart: th.start,
    thursdayEnd: th.end,
    thursdayBreak: th.brk,
    fridayStart: f.start,
    fridayEnd: f.end,
    fridayBreak: f.brk,
    saturdayStart: sa.start,
    saturdayEnd: sa.end,
    saturdayBreak: sa.brk,
    sundayStart: su.start,
    sundayEnd: su.end,
    sundayBreak: su.brk,
  };
}

export async function createEmployee(
  areaId: number,
  input: EmployeeFormValues,
) {
  const session = await requireSession();
  await assertCanAccessArea(session, areaId);
  const data = Schema.parse(input);
  if (data.positionId !== null) {
    await assertPositionInArea(data.positionId, areaId);
  }
  if (data.departmentId !== null) {
    await assertDepartmentInArea(data.departmentId, areaId);
  }
  await db.insert(employees).values({
    areaId,
    name: data.name,
    dob: data.dob,
    gender: data.gender,
    positionId: data.positionId,
    departmentId: data.departmentId,
    ic: data.ic,
    passport: data.passport,
    nationality: data.nationality,
    contactNumber: data.contactNumber,
    email: data.email,
    totalAnnualLeave: data.totalAnnualLeave,
    totalSickLeave: data.totalSickLeave,
    ...scheduleColumns(data.schedule),
    salaryType: data.salary?.type ?? null,
    salaryHour: data.salary?.hour ?? null,
    salaryDay: data.salary?.day ?? null,
    salaryWeek: data.salary?.week ?? null,
    salaryMonth: data.salary?.month ?? null,
    otherSalaryTypeId: data.salary?.otherTypeId ?? null,
    hasOvertime: data.salary?.hasOvertime ?? null,
    hasRestday: data.salary?.hasRestday ?? null,
    hasHoliday: data.salary?.hasHoliday ?? null,
  });
  revalidatePath("/employees");
  revalidatePath(`/employees`);
}

export async function updateEmployee(
  id: number,
  areaId: number,
  input: EmployeeFormValues,
) {
  const session = await requireSession();
  await assertCanAccessArea(session, areaId);
  const data = Schema.parse(input);
  if (data.positionId !== null) {
    await assertPositionInArea(data.positionId, areaId);
  }
  if (data.departmentId !== null) {
    await assertDepartmentInArea(data.departmentId, areaId);
  }

  const [existing] = await db
    .select({ areaId: employees.areaId })
    .from(employees)
    .where(and(eq(employees.id, id), isNull(employees.deletedAt)))
    .limit(1);
  if (!existing) throw new Error("Not found");
  if (existing.areaId !== areaId) {
    throw new Error("Employee does not belong to this area");
  }

  await db
    .update(employees)
    .set({
      areaId,
      name: data.name,
      dob: data.dob,
      gender: data.gender,
      positionId: data.positionId,
      departmentId: data.departmentId,
      ic: data.ic,
      passport: data.passport,
      nationality: data.nationality,
      contactNumber: data.contactNumber,
      email: data.email,
      totalAnnualLeave: data.totalAnnualLeave,
      totalSickLeave: data.totalSickLeave,
      ...scheduleColumns(data.schedule),
      salaryType: data.salary?.type ?? null,
      salaryHour: data.salary?.hour ?? null,
      salaryDay: data.salary?.day ?? null,
      salaryWeek: data.salary?.week ?? null,
      salaryMonth: data.salary?.month ?? null,
      otherSalaryTypeId: data.salary?.otherTypeId ?? null,
      hasOvertime: data.salary?.hasOvertime ?? null,
      hasRestday: data.salary?.hasRestday ?? null,
      hasHoliday: data.salary?.hasHoliday ?? null,
    })
    .where(eq(employees.id, id));
  revalidatePath("/employees");
  revalidatePath(`/employees/${id}`);
}

export async function deleteEmployee(id: number, areaId: number) {
  const session = await requireSession();
  await assertCanAccessArea(session, areaId);
  await db
    .update(employees)
    .set({ deletedAt: new Date() })
    .where(and(eq(employees.id, id), eq(employees.areaId, areaId)));
  revalidatePath("/employees");
}

export async function listPositionsByArea(areaId: number) {
  const session = await requireSession();
  await assertCanAccessArea(session, areaId);
  return db
    .select({ id: positions.id, name: positions.name })
    .from(positions)
    .where(and(eq(positions.areaId, areaId), isNull(positions.deletedAt)))
    .orderBy(positions.name);
}

export type ScheduleDefaults = {
  workStart: string;
  workEnd: string;
};

export type AreaSettingDefaults = {
  rates: {
    otRate: number;
    rdRate: number;
    phRate: number;
    hoursPerWeek: number;
    daysPerMonth: number;
  };
  schedule: ScheduleDefaults;
};

export async function getAreaSettingDefaults(
  areaId: number,
): Promise<AreaSettingDefaults> {
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
  return {
    rates: row
      ? {
          otRate: row.otRate,
          rdRate: row.rdRate,
          phRate: row.phRate,
          hoursPerWeek: row.hoursPerWeek,
          daysPerMonth: row.daysPerMonth,
        }
      : {
          otRate: 1.5,
          rdRate: 2,
          phRate: 3,
          hoursPerWeek: 45,
          daysPerMonth: 24,
        },
    schedule: row
      ? { workStart: row.workStart, workEnd: row.workEnd }
      : { workStart: "07:00", workEnd: "16:00" },
  };
}

export async function listDepartmentsByArea(areaId: number) {
  const session = await requireSession();
  await assertCanAccessArea(session, areaId);
  return db
    .select({ id: departments.id, name: departments.name })
    .from(departments)
    .where(and(eq(departments.areaId, areaId), isNull(departments.deletedAt)))
    .orderBy(departments.name);
}

export type EmployeeFormConfig = {
  dob: boolean;
  gender: boolean;
  positions: boolean;
  departments: boolean;
  nationality: boolean;
  ic: boolean;
  passport: boolean;
  contactNumber: boolean;
  email: boolean;
  totalAnnualLeave: boolean;
  totalSickLeave: boolean;
};

const EmployeeFormConfigSchema = z.object({
  dob: z.boolean(),
  gender: z.boolean(),
  positions: z.boolean(),
  departments: z.boolean(),
  nationality: z.boolean(),
  ic: z.boolean(),
  passport: z.boolean(),
  contactNumber: z.boolean(),
  email: z.boolean(),
  totalAnnualLeave: z.boolean(),
  totalSickLeave: z.boolean(),
});

export async function updateEmployeeFormConfig(
  areaId: number,
  input: EmployeeFormConfig,
) {
  const session = await requireSession();
  await assertCanAccessArea(session, areaId);
  const data = EmployeeFormConfigSchema.parse(input);
  await db
    .insert(employeeForm)
    .values({ areaId, ...data })
    .onConflictDoUpdate({ target: employeeForm.areaId, set: data });
  revalidatePath("/employees/new");
  revalidatePath(`/employees`);
}

export async function getEmployeeFormConfig(
  areaId: number,
): Promise<EmployeeFormConfig> {
  const [row] = await db
    .select({
      dob: employeeForm.dob,
      gender: employeeForm.gender,
      positions: employeeForm.positions,
      departments: employeeForm.departments,
      nationality: employeeForm.nationality,
      ic: employeeForm.ic,
      passport: employeeForm.passport,
      contactNumber: employeeForm.contactNumber,
      email: employeeForm.email,
      totalAnnualLeave: employeeForm.totalAnnualLeave,
      totalSickLeave: employeeForm.totalSickLeave,
    })
    .from(employeeForm)
    .where(eq(employeeForm.areaId, areaId))
    .limit(1);
  return (
    row ?? {
      dob: false,
      gender: false,
      positions: false,
      departments: false,
      nationality: false,
      ic: false,
      passport: false,
      contactNumber: false,
      email: false,
      totalAnnualLeave: false,
      totalSickLeave: false,
    }
  );
}
