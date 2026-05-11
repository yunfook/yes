import "server-only";
import { and, eq, ilike, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  employees,
  areas,
  positions,
  departments,
  payMultiplier,
} from "@/db/schema";

const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

type DayKey = (typeof DAY_KEYS)[number];

const BREAK_MINUTES: Record<string, number> = {
  "30m": 30,
  "1h": 60,
  "2h": 120,
  none: 0,
};

function parseHHMM(s: string | null | undefined): number | null {
  if (!s) return null;
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

function dayWorkMinutes(opts: {
  start: string | null;
  end: string | null;
  breakStart: string | null;
  breakType: string | null;
}): number {
  const s = parseHHMM(opts.start);
  const e = parseHHMM(opts.end);
  if (s == null || e == null || e <= s) return 0;
  let mins = e - s;
  if (opts.breakStart && opts.breakType && opts.breakType !== "none") {
    mins -= BREAK_MINUTES[opts.breakType] ?? 0;
  }
  return Math.max(0, mins);
}

export type SalaryCalcResult = {
  employee: {
    id: number;
    name: string;
    area: string | null;
    position: string | null;
    department: string | null;
    salaryType: string | null;
    salaryHour: number | null;
    salaryMonth: number | null;
    breakType: string | null;
    restdays: string[];
  };
  year: number;
  month: number;
  monthName: string;
  daysInMonth: number;
  workingDays: number;
  restDays: number;
  unscheduledDays: number;
  totalHours: number;
  totalPay: number | null;
  monthlySalary: number | null;
  breakdown: {
    date: string;
    weekday: DayKey;
    status: "work" | "restday" | "no-schedule";
    hours: number;
    pay: number | null;
  }[];
};

type EmployeeRow = Awaited<ReturnType<typeof findEmployees>>[number];

async function findEmployees(opts: { areaIds: number[]; name: string }) {
  return db
    .select({
      id: employees.id,
      name: employees.name,
      areaName: areas.name,
      positionName: positions.name,
      departmentName: departments.name,
      salaryType: employees.salaryType,
      salaryHour: employees.salaryHour,
      salaryMonth: employees.salaryMonth,
      restday: employees.restday,
      breakType: employees.breakType,
      mondayStart: employees.mondayStart,
      mondayEnd: employees.mondayEnd,
      mondayBreak: employees.mondayBreak,
      tuesdayStart: employees.tuesdayStart,
      tuesdayEnd: employees.tuesdayEnd,
      tuesdayBreak: employees.tuesdayBreak,
      wednesdayStart: employees.wednesdayStart,
      wednesdayEnd: employees.wednesdayEnd,
      wednesdayBreak: employees.wednesdayBreak,
      thursdayStart: employees.thursdayStart,
      thursdayEnd: employees.thursdayEnd,
      thursdayBreak: employees.thursdayBreak,
      fridayStart: employees.fridayStart,
      fridayEnd: employees.fridayEnd,
      fridayBreak: employees.fridayBreak,
      saturdayStart: employees.saturdayStart,
      saturdayEnd: employees.saturdayEnd,
      saturdayBreak: employees.saturdayBreak,
      sundayStart: employees.sundayStart,
      sundayEnd: employees.sundayEnd,
      sundayBreak: employees.sundayBreak,
    })
    .from(employees)
    .leftJoin(areas, eq(employees.areaId, areas.id))
    .leftJoin(positions, eq(employees.positionId, positions.id))
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .where(
      and(
        isNull(employees.deletedAt),
        inArray(employees.areaId, opts.areaIds),
        ilike(employees.name, `%${opts.name}%`),
      ),
    )
    .orderBy(employees.name);
}

function getDaySchedule(emp: EmployeeRow, day: DayKey) {
  return {
    start: emp[`${day}Start` as keyof EmployeeRow] as string | null,
    end: emp[`${day}End` as keyof EmployeeRow] as string | null,
    breakStart: emp[`${day}Break` as keyof EmployeeRow] as string | null,
  };
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function computeForEmployee(
  emp: EmployeeRow,
  year: number,
  month: number,
): SalaryCalcResult {
  const restdays = new Set(
    (emp.restday ?? []).map((d) => d.toLowerCase()),
  );
  const daysInMonth = new Date(year, month, 0).getDate();

  let totalMinutes = 0;
  let workingDays = 0;
  let restDayCount = 0;
  let unscheduledDays = 0;
  const breakdown: SalaryCalcResult["breakdown"] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    const weekdayIdx = date.getDay();
    const weekday = DAY_KEYS[weekdayIdx];
    const dateStr = `${year}-${pad(month)}-${pad(d)}`;

    if (restdays.has(weekday)) {
      restDayCount++;
      breakdown.push({
        date: dateStr,
        weekday,
        status: "restday",
        hours: 0,
        pay: 0,
      });
      continue;
    }

    const sched = getDaySchedule(emp, weekday);
    const minutes = dayWorkMinutes({
      start: sched.start,
      end: sched.end,
      breakStart: sched.breakStart,
      breakType: emp.breakType,
    });

    if (minutes === 0) {
      unscheduledDays++;
      breakdown.push({
        date: dateStr,
        weekday,
        status: "no-schedule",
        hours: 0,
        pay: 0,
      });
      continue;
    }

    workingDays++;
    totalMinutes += minutes;
    const hours = minutes / 60;
    const pay = emp.salaryHour != null ? hours * emp.salaryHour : null;
    breakdown.push({
      date: dateStr,
      weekday,
      status: "work",
      hours: Number(hours.toFixed(2)),
      pay: pay == null ? null : Number(pay.toFixed(2)),
    });
  }

  const totalHours = totalMinutes / 60;
  const totalPay =
    emp.salaryHour != null ? Number((totalHours * emp.salaryHour).toFixed(2)) : null;

  return {
    employee: {
      id: emp.id,
      name: emp.name,
      area: emp.areaName,
      position: emp.positionName,
      department: emp.departmentName,
      salaryType: emp.salaryType,
      salaryHour: emp.salaryHour,
      salaryMonth: emp.salaryMonth,
      breakType: emp.breakType,
      restdays: emp.restday ?? [],
    },
    year,
    month,
    monthName: MONTH_NAMES[month - 1],
    daysInMonth,
    workingDays,
    restDays: restDayCount,
    unscheduledDays,
    totalHours: Number(totalHours.toFixed(2)),
    totalPay,
    monthlySalary: emp.salaryType === "monthly" ? emp.salaryMonth : null,
    breakdown,
  };
}

export type ExtraPayType =
  | "overtime"
  | "restday"
  | "holiday"
  | "double"
  | "triple";

const EXTRA_PAY_ALIASES: Record<string, ExtraPayType> = {
  overtime: "overtime",
  ot: "overtime",
  restday: "restday",
  "rest-day": "restday",
  rest_day: "restday",
  rd: "restday",
  od: "restday",
  offday: "restday",
  "off-day": "restday",
  off_day: "restday",
  holiday: "holiday",
  ph: "holiday",
  publicholiday: "holiday",
  "public-holiday": "holiday",
  public_holiday: "holiday",
  double: "double",
  "2x": "double",
  triple: "triple",
  "3x": "triple",
};

export function normalizeExtraPayType(input: string): ExtraPayType {
  const key = input.trim().toLowerCase();
  const canonical = EXTRA_PAY_ALIASES[key];
  if (!canonical) {
    throw new Error(`Unknown extra pay type: ${input}`);
  }
  return canonical;
}

type ExtraPayEmployee = {
  id: number;
  name: string;
  areaId: number | null;
  areaName: string | null;
  positionName: string | null;
  departmentName: string | null;
  salaryType: string | null;
  salaryHour: number | null;
  salaryMonth: number | null;
  hasOvertime: boolean | null;
  hasRestday: boolean | null;
  hasHoliday: boolean | null;
  hasDouble: boolean | null;
  hasTriple: boolean | null;
};

async function findExtraPayEmployees(opts: {
  areaIds: number[];
  name: string;
}): Promise<ExtraPayEmployee[]> {
  return db
    .select({
      id: employees.id,
      name: employees.name,
      areaId: employees.areaId,
      areaName: areas.name,
      positionName: positions.name,
      departmentName: departments.name,
      salaryType: employees.salaryType,
      salaryHour: employees.salaryHour,
      salaryMonth: employees.salaryMonth,
      hasOvertime: employees.hasOvertime,
      hasRestday: employees.hasRestday,
      hasHoliday: employees.hasHoliday,
      hasDouble: employees.hasDouble,
      hasTriple: employees.hasTriple,
    })
    .from(employees)
    .leftJoin(areas, eq(employees.areaId, areas.id))
    .leftJoin(positions, eq(employees.positionId, positions.id))
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .where(
      and(
        isNull(employees.deletedAt),
        inArray(employees.areaId, opts.areaIds),
        ilike(employees.name, `%${opts.name}%`),
      ),
    )
    .orderBy(employees.name);
}

type Multipliers = typeof payMultiplier.$inferSelect;

async function loadMultiplier(areaId: number): Promise<Multipliers | null> {
  const rows = await db
    .select()
    .from(payMultiplier)
    .where(eq(payMultiplier.areaId, areaId))
    .limit(1);
  return rows[0] ?? null;
}

function multiplierFor(
  type: ExtraPayType,
  mult: Multipliers | null,
): { rate: number; areaEnabled: boolean; label: string } {
  switch (type) {
    case "overtime":
      return {
        rate: mult?.otRate ?? 1.5,
        areaEnabled: mult?.hasOt ?? true,
        label: "Overtime",
      };
    case "restday":
      return {
        rate: mult?.rdRate ?? 2,
        areaEnabled: mult?.hasRd ?? true,
        label: "Restday",
      };
    case "holiday":
      return {
        rate: mult?.phRate ?? 3,
        areaEnabled: mult?.hasPh ?? true,
        label: "Public Holiday",
      };
    case "double":
      return {
        rate: 2,
        areaEnabled: mult?.hasDbl ?? false,
        label: "Double",
      };
    case "triple":
      return {
        rate: 3,
        areaEnabled: mult?.hasTpl ?? false,
        label: "Triple",
      };
  }
}

function eligibilityFlag(type: ExtraPayType, emp: ExtraPayEmployee): boolean {
  switch (type) {
    case "overtime":
      return emp.hasOvertime === true;
    case "restday":
      return emp.hasRestday === true;
    case "holiday":
      return emp.hasHoliday === true;
    case "double":
      return emp.hasDouble === true;
    case "triple":
      return emp.hasTriple === true;
  }
}

export async function calculateExtraPayForChat(opts: {
  areaIds: number[];
  employeeName: string;
  hours: number;
  type: ExtraPayType;
}): Promise<
  | {
      ok: true;
      employee: {
        id: number;
        name: string;
        area: string | null;
        position: string | null;
        department: string | null;
        salaryType: string | null;
      };
      type: ExtraPayType;
      label: string;
      hours: number;
      hourlyRate: number;
      multiplier: number;
      effectiveHourly: number;
      totalPay: number;
      employeeEligible: boolean;
      areaEnabled: boolean;
      warning?: string;
    }
  | { ok: false; error: string; candidates?: string[] }
> {
  if (opts.hours <= 0) {
    return { ok: false, error: "Hours must be a positive number." };
  }
  if (opts.areaIds.length === 0) {
    return { ok: false, error: "No accessible areas in scope." };
  }

  const rows = await findExtraPayEmployees({
    areaIds: opts.areaIds,
    name: opts.employeeName,
  });

  if (rows.length === 0) {
    return {
      ok: false,
      error: `No employee matching "${opts.employeeName}" found in scope.`,
    };
  }
  if (rows.length > 1) {
    return {
      ok: false,
      error: `Multiple employees match "${opts.employeeName}". Ask the user which one.`,
      candidates: rows.map((r) => r.name),
    };
  }

  const emp = rows[0];
  if (emp.salaryHour == null) {
    return {
      ok: false,
      error: `${emp.name} has no hourly rate set. Cannot calculate ${opts.type} pay.`,
    };
  }

  const mult = emp.areaId != null ? await loadMultiplier(emp.areaId) : null;
  const { rate, areaEnabled, label } = multiplierFor(opts.type, mult);
  const employeeEligible = eligibilityFlag(opts.type, emp);

  const effectiveHourly = emp.salaryHour * rate;
  const totalPay = Number((effectiveHourly * opts.hours).toFixed(2));

  const warnings: string[] = [];
  if (!areaEnabled) {
    warnings.push(
      `${label} multiplier is disabled at the area level (${emp.areaName ?? "unknown area"}).`,
    );
  }
  if (!employeeEligible) {
    warnings.push(`${emp.name} is not flagged as eligible for ${label}.`);
  }

  return {
    ok: true,
    employee: {
      id: emp.id,
      name: emp.name,
      area: emp.areaName,
      position: emp.positionName,
      department: emp.departmentName,
      salaryType: emp.salaryType,
    },
    type: opts.type,
    label,
    hours: opts.hours,
    hourlyRate: emp.salaryHour,
    multiplier: rate,
    effectiveHourly: Number(effectiveHourly.toFixed(2)),
    totalPay,
    employeeEligible,
    areaEnabled,
    warning: warnings.length > 0 ? warnings.join(" ") : undefined,
  };
}

export async function calculateMonthlyPayForChat(opts: {
  areaIds: number[];
  employeeName: string;
  year: number;
  month: number;
}): Promise<
  | { ok: true; result: SalaryCalcResult }
  | { ok: false; error: string; candidates?: string[] }
> {
  if (opts.month < 1 || opts.month > 12) {
    return { ok: false, error: `Invalid month ${opts.month}. Use 1-12.` };
  }
  if (opts.areaIds.length === 0) {
    return { ok: false, error: "No accessible areas in scope." };
  }

  const rows = await findEmployees({
    areaIds: opts.areaIds,
    name: opts.employeeName,
  });

  if (rows.length === 0) {
    return {
      ok: false,
      error: `No employee matching "${opts.employeeName}" found in scope.`,
    };
  }
  if (rows.length > 1) {
    return {
      ok: false,
      error: `Multiple employees match "${opts.employeeName}". Ask the user which one.`,
      candidates: rows.map((r) => r.name),
    };
  }

  return { ok: true, result: computeForEmployee(rows[0], opts.year, opts.month) };
}
