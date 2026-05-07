"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import {
  employees,
  employeeForm,
  positions,
  departments,
  areaSetting,
} from "@/db/schema";
import { requireSession, assertCanAccessArea } from "@/lib/authz";

import { RESTDAY_VALUES, type RestdayValue } from "./restday";

const NullishStr = z.string().trim().min(1).nullable();

const SalarySchema = z
  .object({
    type: z.enum(["hour", "monthly", "other"]),
    hour: z.number().nonnegative().nullable(),
    day: z.number().nonnegative().nullable(),
    month: z.number().nonnegative().nullable(),
  })
  .nullable();

const Schema = z.object({
  name: z.string().trim().min(1).max(120),
  dob: NullishStr,
  gender: z.enum(["male", "female"]).nullable(),
  positionId: z.number().int().positive().nullable(),
  departmentId: z.number().int().positive().nullable(),
  ic: NullishStr,
  passport: NullishStr,
  nationality: z.enum(["local", "international"]).nullable(),
  restday: z.array(z.enum(RESTDAY_VALUES)).min(1).nullable(),
  salary: SalarySchema,
});

export type EmployeeFormValues = z.infer<typeof Schema>;

export type EmployeeRow = {
  id: number;
  name: string;
  dob: string | null;
  gender: "male" | "female" | null;
  positionId: number | null;
  positionName: string | null;
  departmentId: number | null;
  departmentName: string | null;
  ic: string | null;
  passport: string | null;
  nationality: "local" | "international" | null;
  restday: RestdayValue[] | null;
  salaryType: "hour" | "monthly" | "other" | null;
  salaryHour: number | null;
  salaryDay: number | null;
  salaryMonth: number | null;
};

export async function listEmployeesByArea(areaId: number): Promise<EmployeeRow[]> {
  const session = await requireSession();
  await assertCanAccessArea(session, areaId);

  const rows = await db
    .select({
      id: employees.id,
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
      restday: employees.restday,
    })
    .from(employees)
    .innerJoin(positions, eq(positions.id, employees.positionId))
    .leftJoin(departments, eq(departments.id, employees.departmentId))
    .where(eq(positions.areaId, areaId))
    .orderBy(employees.name);

  return rows as EmployeeRow[];
}

async function assertPositionInArea(positionId: number, areaId: number) {
  const [row] = await db
    .select({ areaId: positions.areaId })
    .from(positions)
    .where(eq(positions.id, positionId))
    .limit(1);
  if (!row || row.areaId !== areaId) {
    throw new Error("Position does not belong to this area");
  }
}

async function assertDepartmentInArea(departmentId: number, areaId: number) {
  const [row] = await db
    .select({ areaId: departments.areaId })
    .from(departments)
    .where(eq(departments.id, departmentId))
    .limit(1);
  if (!row || row.areaId !== areaId) {
    throw new Error("Department does not belong to this area");
  }
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
    name: data.name,
    dob: data.dob,
    gender: data.gender,
    positionId: data.positionId,
    departmentId: data.departmentId,
    ic: data.ic,
    passport: data.passport,
    nationality: data.nationality,
    restday: data.restday,
    salaryType: data.salary?.type ?? null,
    salaryHour: data.salary?.hour ?? null,
    salaryDay: data.salary?.day ?? null,
    salaryMonth: data.salary?.month ?? null,
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
    .select({ positionId: employees.positionId, areaId: positions.areaId })
    .from(employees)
    .leftJoin(positions, eq(positions.id, employees.positionId))
    .where(eq(employees.id, id))
    .limit(1);
  if (!existing) throw new Error("Not found");
  if (existing.areaId !== null && existing.areaId !== areaId) {
    await assertCanAccessArea(session, existing.areaId);
  }

  await db
    .update(employees)
    .set({
      name: data.name,
      dob: data.dob,
      gender: data.gender,
      positionId: data.positionId,
      departmentId: data.departmentId,
      ic: data.ic,
      passport: data.passport,
      nationality: data.nationality,
      restday: data.restday,
      salaryType: data.salary?.type ?? null,
      salaryHour: data.salary?.hour ?? null,
      salaryDay: data.salary?.day ?? null,
      salaryMonth: data.salary?.month ?? null,
    })
    .where(eq(employees.id, id));
  revalidatePath("/employees");
  revalidatePath(`/employees/${id}`);
}

export async function deleteEmployee(id: number, areaId: number) {
  const session = await requireSession();
  await assertCanAccessArea(session, areaId);
  await db
    .delete(employees)
    .where(
      and(
        eq(employees.id, id),
        // ensure delete only applies if the employee's current position is in the area
      ),
    );
  revalidatePath("/employees");
}

export async function listPositionsByArea(areaId: number) {
  const session = await requireSession();
  await assertCanAccessArea(session, areaId);
  return db
    .select({ id: positions.id, name: positions.name })
    .from(positions)
    .where(eq(positions.areaId, areaId))
    .orderBy(positions.name);
}

export async function getAreaSettingRates(areaId: number) {
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

export async function listDepartmentsByArea(areaId: number) {
  const session = await requireSession();
  await assertCanAccessArea(session, areaId);
  return db
    .select({ id: departments.id, name: departments.name })
    .from(departments)
    .where(eq(departments.areaId, areaId))
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
  restday: boolean;
};

const EmployeeFormConfigSchema = z.object({
  dob: z.boolean(),
  gender: z.boolean(),
  positions: z.boolean(),
  departments: z.boolean(),
  nationality: z.boolean(),
  ic: z.boolean(),
  passport: z.boolean(),
  restday: z.boolean(),
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
      restday: employeeForm.restday,
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
      restday: false,
    }
  );
}
