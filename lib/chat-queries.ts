import "server-only";
import {
  and,
  arrayContains,
  eq,
  ilike,
  inArray,
  isNull,
  type SQL,
} from "drizzle-orm";
import { db } from "@/db";
import {
  employees,
  areas,
  positions,
  departments,
  otherSalaryType,
} from "@/db/schema";

type SalaryTypeFilter = "hour" | "monthly" | "other" | "all";
type SortBy = "name" | "salaryHour" | "salaryMonth" | "estimatedMonthly";
type SortOrder = "asc" | "desc";

export type EmployeeChatRow = {
  id: number;
  name: string;
  area: string | null;
  position: string | null;
  department: string | null;
  salaryType: string | null;
  salaryHour: number | null;
  salaryMonth: number | null;
  otherSalaryType: string | null;
  hoursPerDay: number | null;
  daysPerMonth: number | null;
  estimatedMonthly: number | null;
};

function estimateMonthly(r: {
  salaryType: string | null;
  salaryHour: number | null;
  salaryMonth: number | null;
  hoursPerDay: number | null;
  daysPerMonth: number | null;
}): number | null {
  if (r.salaryType === "monthly") return r.salaryMonth ?? null;
  if (r.salaryType === "hour") {
    if (r.salaryHour == null) return null;
    const hpd = r.hoursPerDay ?? 0;
    const dpm = r.daysPerMonth ?? 0;
    if (hpd <= 0 || dpm <= 0) return null;
    return r.salaryHour * hpd * dpm;
  }
  return r.salaryMonth ?? null;
}

type RestdayFilter =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday"
  | "none";

export async function listEmployeesForChat(opts: {
  areaIds: number[];
  salaryType: SalaryTypeFilter;
  positionName?: string | null;
  departmentName?: string | null;
  nameSearch?: string | null;
  restday?: RestdayFilter | null;
  sortBy: SortBy;
  sortOrder: SortOrder;
  limit: number;
}): Promise<{ rows: EmployeeChatRow[]; totalMatching: number }> {
  if (opts.areaIds.length === 0) return { rows: [], totalMatching: 0 };

  const conditions: SQL[] = [
    isNull(employees.deletedAt),
    inArray(employees.areaId, opts.areaIds),
  ];
  if (opts.salaryType !== "all") {
    conditions.push(eq(employees.salaryType, opts.salaryType));
  }
  if (opts.positionName) {
    conditions.push(ilike(positions.name, opts.positionName));
  }
  if (opts.departmentName) {
    conditions.push(ilike(departments.name, opts.departmentName));
  }
  if (opts.nameSearch) {
    conditions.push(ilike(employees.name, `%${opts.nameSearch}%`));
  }
  if (opts.restday) {
    conditions.push(arrayContains(employees.restday, [opts.restday]));
  }

  const raw = await db
    .select({
      id: employees.id,
      name: employees.name,
      area: areas.name,
      position: positions.name,
      department: departments.name,
      salaryType: employees.salaryType,
      salaryHour: employees.salaryHour,
      salaryMonth: employees.salaryMonth,
      otherSalaryType: otherSalaryType.name,
      hoursPerDay: employees.hoursPerDay,
      daysPerMonth: employees.daysPerMonth,
    })
    .from(employees)
    .leftJoin(areas, eq(employees.areaId, areas.id))
    .leftJoin(positions, eq(employees.positionId, positions.id))
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .leftJoin(otherSalaryType, eq(employees.otherSalaryTypeId, otherSalaryType.id))
    .where(and(...conditions));

  const enriched: EmployeeChatRow[] = raw.map((r) => ({
    ...r,
    estimatedMonthly: estimateMonthly(r),
  }));

  const dir = opts.sortOrder === "desc" ? -1 : 1;
  enriched.sort((a, b) => {
    const av = a[opts.sortBy];
    const bv = b[opts.sortBy];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
    return String(av).localeCompare(String(bv)) * dir;
  });

  return {
    rows: enriched.slice(0, opts.limit),
    totalMatching: enriched.length,
  };
}
