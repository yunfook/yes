import "server-only";
import ExcelJS from "exceljs";
import {
  and,
  arrayContains,
  eq,
  ilike,
  inArray,
  isNull,
  sql,
  type SQL,
} from "drizzle-orm";
import { db } from "@/db";
import {
  employees,
  areas,
  positions,
  departments,
  otherSalaryType,
  payMultiplier,
} from "@/db/schema";
import {
  multiplierFor,
  eligibilityFlag,
  type ExtraPayType,
} from "@/lib/payroll-calc";

const DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export const COLUMN_KEYS = [
  "name",
  "area",
  "position",
  "department",
  "email",
  "contact",
  "nationality",
  "gender",
  "ic",
  "passport",
  "restday",
  "breakType",
  "salaryType",
  "salaryHour",
  "salaryMonth",
  "dailyPay",
  "estimatedMonthly",
  "otherSalaryType",
  "hoursPerDay",
  "daysPerMonth",
  "hasOvertime",
  "hasRestday",
  "hasHoliday",
  "hasDouble",
  "hasTriple",
  "otRate",
  "rdRate",
  "phRate",
  "annualLeave",
  "sickLeave",
  "schedule",
  "extraPay",
] as const;

export type ColumnKey = (typeof COLUMN_KEYS)[number];

const COLUMN_HEADERS: Record<ColumnKey, string> = {
  name: "Name",
  area: "Area",
  position: "Position",
  department: "Department",
  email: "Email",
  contact: "Contact",
  nationality: "Nationality",
  gender: "Gender",
  ic: "IC",
  passport: "Passport",
  restday: "Restdays",
  breakType: "Break Type",
  salaryType: "Salary Type",
  salaryHour: "Hourly Rate",
  salaryMonth: "Monthly Salary",
  dailyPay: "Daily Pay",
  estimatedMonthly: "Estimated Monthly",
  otherSalaryType: "Other Salary Type",
  hoursPerDay: "Hours/Day",
  daysPerMonth: "Days/Month",
  hasOvertime: "OT Eligible",
  hasRestday: "Restday Eligible",
  hasHoliday: "Holiday Eligible",
  hasDouble: "Double Eligible",
  hasTriple: "Triple Eligible",
  otRate: "OT Rate",
  rdRate: "Restday Rate",
  phRate: "Holiday Rate",
  annualLeave: "Annual Leave",
  sickLeave: "Sick Leave",
  schedule: "Weekly Schedule",
  extraPay: "Pay",
};

function styleHeader(row: ExcelJS.Row) {
  row.font = { bold: true };
  row.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE5E7EB" },
    };
    cell.border = { bottom: { style: "thin", color: { argb: "FF9CA3AF" } } };
  });
}

function autoSize(ws: ExcelJS.Worksheet, min = 10, max = 50) {
  ws.columns.forEach((col) => {
    let maxLen = min;
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const len = String(cell.value ?? "").length;
      if (len > maxLen) maxLen = len;
    });
    col.width = Math.min(maxLen + 2, max);
  });
}

type SalaryTypeFilter = "hour" | "monthly" | "other" | "all";

export type RestdayFilter =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday"
  | "none";

export type CustomExportFilters = {
  salaryType?: SalaryTypeFilter;
  positionName?: string | null;
  departmentName?: string | null;
  nameSearch?: string | null;
  restday?: RestdayFilter | null;
};

export type IneligibleHandling = "skip" | "zero" | "compute-anyway";

export type ExtraPaySpec = {
  hours: number;
  type: ExtraPayType;
  ineligibleHandling?: IneligibleHandling | null;
};

type EmployeeRow = Awaited<ReturnType<typeof fetchEmployees>>[number];

async function fetchEmployees(opts: {
  areaIds: number[];
  filters: CustomExportFilters;
}) {
  if (opts.areaIds.length === 0) return [];

  const conditions: SQL[] = [
    isNull(employees.deletedAt),
    inArray(employees.areaId, opts.areaIds),
  ];
  if (opts.filters.salaryType && opts.filters.salaryType !== "all") {
    conditions.push(eq(employees.salaryType, opts.filters.salaryType));
  }
  if (opts.filters.positionName) {
    conditions.push(ilike(positions.name, opts.filters.positionName));
  }
  if (opts.filters.departmentName) {
    conditions.push(ilike(departments.name, opts.filters.departmentName));
  }
  if (opts.filters.nameSearch) {
    conditions.push(ilike(employees.name, `%${opts.filters.nameSearch}%`));
  }
  if (opts.filters.restday) {
    conditions.push(arrayContains(employees.restday, [opts.filters.restday]));
  }

  return db
    .select({
      id: employees.id,
      name: employees.name,
      areaId: employees.areaId,
      areaName: areas.name,
      positionName: positions.name,
      departmentName: departments.name,
      email: employees.email,
      contactNumber: employees.contactNumber,
      nationality: employees.nationality,
      gender: employees.gender,
      ic: employees.ic,
      passport: employees.passport,
      salaryType: employees.salaryType,
      salaryHour: employees.salaryHour,
      salaryMonth: employees.salaryMonth,
      otherSalaryTypeName: otherSalaryType.name,
      hoursPerDay: employees.hoursPerDay,
      daysPerMonth: employees.daysPerMonth,
      hasOvertime: employees.hasOvertime,
      hasRestday: employees.hasRestday,
      hasHoliday: employees.hasHoliday,
      hasDouble: employees.hasDouble,
      hasTriple: employees.hasTriple,
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
      totalAnnualLeave: employees.totalAnnualLeave,
      totalSickLeave: employees.totalSickLeave,
    })
    .from(employees)
    .leftJoin(areas, eq(employees.areaId, areas.id))
    .leftJoin(positions, eq(employees.positionId, positions.id))
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .leftJoin(otherSalaryType, eq(employees.otherSalaryTypeId, otherSalaryType.id))
    .where(and(...conditions))
    .orderBy(areas.name, employees.name);
}

function formatSchedule(r: EmployeeRow): string {
  const restdays = new Set(
    (r.restday ?? []).map((d) => d.toLowerCase()),
  );
  return DAY_KEYS.map((day) => {
    const label = day.charAt(0).toUpperCase() + day.slice(1, 3);
    if (restdays.has(day)) return `${label}: rest`;
    const start = r[`${day}Start` as keyof EmployeeRow] as string | null;
    const end = r[`${day}End` as keyof EmployeeRow] as string | null;
    const brk = r[`${day}Break` as keyof EmployeeRow] as string | null;
    if (!start || !end) return `${label}: —`;
    const brkPart = brk ? ` (break ${brk})` : "";
    return `${label}: ${start}-${end}${brkPart}`;
  }).join("\n");
}

function dailyPay(r: EmployeeRow): number | null {
  if (r.salaryType === "hour") {
    if (r.salaryHour == null || r.hoursPerDay == null) return null;
    return r.salaryHour * r.hoursPerDay;
  }
  if (r.salaryType === "monthly") {
    if (r.salaryMonth == null || r.daysPerMonth == null || r.daysPerMonth === 0)
      return null;
    return r.salaryMonth / r.daysPerMonth;
  }
  return null;
}

function estimatedMonthly(r: EmployeeRow): number | null {
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

function cellValue(
  key: ColumnKey,
  r: EmployeeRow,
  multByArea: Map<number, typeof payMultiplier.$inferSelect>,
  extraPay: ExtraPaySpec | undefined,
): string | number | null {
  const mult = r.areaId ? multByArea.get(r.areaId) : undefined;
  switch (key) {
    case "name":
      return r.name;
    case "area":
      return r.areaName ?? "";
    case "position":
      return r.positionName ?? "";
    case "department":
      return r.departmentName ?? "";
    case "email":
      return r.email ?? "";
    case "contact":
      return r.contactNumber ?? "";
    case "nationality":
      return r.nationality ?? "";
    case "gender":
      return r.gender ?? "";
    case "ic":
      return r.ic ?? "";
    case "passport":
      return r.passport ?? "";
    case "restday":
      return (r.restday ?? []).join(", ");
    case "breakType":
      return r.breakType ?? "";
    case "salaryType":
      return r.salaryType ?? "";
    case "salaryHour":
      return r.salaryHour ?? "";
    case "salaryMonth":
      return r.salaryMonth ?? "";
    case "dailyPay": {
      const v = dailyPay(r);
      return v == null ? "" : Number(v.toFixed(2));
    }
    case "estimatedMonthly": {
      const v = estimatedMonthly(r);
      return v == null ? "" : Number(v.toFixed(2));
    }
    case "otherSalaryType":
      return r.otherSalaryTypeName ?? "";
    case "hoursPerDay":
      return r.hoursPerDay ?? "";
    case "daysPerMonth":
      return r.daysPerMonth ?? "";
    case "hasOvertime":
      return r.hasOvertime ? "Yes" : "No";
    case "hasRestday":
      return r.hasRestday ? "Yes" : "No";
    case "hasHoliday":
      return r.hasHoliday ? "Yes" : "No";
    case "hasDouble":
      return r.hasDouble ? "Yes" : "No";
    case "hasTriple":
      return r.hasTriple ? "Yes" : "No";
    case "otRate":
      return mult?.hasOt ? mult.otRate : "";
    case "rdRate":
      return mult?.hasRd ? mult.rdRate : "";
    case "phRate":
      return mult?.hasPh ? mult.phRate : "";
    case "annualLeave":
      return r.totalAnnualLeave ?? "";
    case "sickLeave":
      return r.totalSickLeave ?? "";
    case "schedule":
      return formatSchedule(r);
    case "extraPay": {
      if (!extraPay) return "";
      if (r.salaryHour == null) return "";
      const eligible = eligibilityFlag(extraPay.type, r);
      if (!eligible && extraPay.ineligibleHandling === "zero") return 0;
      const { rate } = multiplierFor(extraPay.type, mult ?? null);
      const pay = r.salaryHour * extraPay.hours * rate;
      return Number(pay.toFixed(2));
    }
  }
}

export type WorkbookResult =
  | { kind: "workbook"; buffer: Buffer; rowCount: number; skippedCount: number }
  | {
      kind: "needs-eligibility-clarification";
      label: string;
      ineligibleNames: string[];
      ineligibleCount: number;
      eligibleCount: number;
    };

export async function buildCustomEmployeesWorkbook(opts: {
  areaIds: number[];
  filters: CustomExportFilters;
  columns: ColumnKey[];
  sheetTitle?: string;
  extraPay?: ExtraPaySpec;
}): Promise<WorkbookResult> {
  if (opts.columns.includes("extraPay") && !opts.extraPay) {
    throw new Error(
      "extraPay column requested but no extraPay spec provided.",
    );
  }

  const rows = await fetchEmployees({
    areaIds: opts.areaIds,
    filters: opts.filters,
  });

  const needsMultiplier =
    opts.columns.some(
      (c) => c === "otRate" || c === "rdRate" || c === "phRate",
    ) || opts.columns.includes("extraPay");
  let multByArea = new Map<number, typeof payMultiplier.$inferSelect>();
  if (needsMultiplier && opts.areaIds.length > 0) {
    const ms = await db
      .select()
      .from(payMultiplier)
      .where(inArray(payMultiplier.areaId, opts.areaIds));
    multByArea = new Map(ms.map((m) => [m.areaId, m]));
  }

  let exportRows = rows;
  let skippedCount = 0;
  if (opts.extraPay && opts.columns.includes("extraPay")) {
    const ineligible = rows.filter(
      (r) => !eligibilityFlag(opts.extraPay!.type, r),
    );
    if (ineligible.length > 0 && !opts.extraPay.ineligibleHandling) {
      const { label } = multiplierFor(opts.extraPay.type, null);
      return {
        kind: "needs-eligibility-clarification",
        label,
        ineligibleNames: ineligible.map((r) => r.name),
        ineligibleCount: ineligible.length,
        eligibleCount: rows.length - ineligible.length,
      };
    }
    if (opts.extraPay.ineligibleHandling === "skip") {
      exportRows = rows.filter((r) => eligibilityFlag(opts.extraPay!.type, r));
      skippedCount = rows.length - exportRows.length;
    }
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = "HR AI Assistant";
  wb.created = new Date();
  const ws = wb.addWorksheet((opts.sheetTitle ?? "Employees").slice(0, 31));

  ws.columns = opts.columns.map((key) => ({
    header: COLUMN_HEADERS[key],
    key,
  }));
  styleHeader(ws.getRow(1));

  for (const r of exportRows) {
    const rowData: Record<string, string | number | null> = {};
    for (const key of opts.columns) {
      rowData[key] = cellValue(key, r, multByArea, opts.extraPay);
    }
    const added = ws.addRow(rowData);
    if (opts.columns.includes("schedule")) {
      added.getCell("schedule").alignment = { wrapText: true, vertical: "top" };
      added.height = 90;
    }
  }

  autoSize(ws);

  return {
    kind: "workbook",
    buffer: Buffer.from(await wb.xlsx.writeBuffer()),
    rowCount: exportRows.length,
    skippedCount,
  };
}

export async function listScopeMetadata(areaIds: number[]) {
  if (areaIds.length === 0) return { positions: [], departments: [] };
  const [pos, dep] = await Promise.all([
    db
      .select({ name: positions.name })
      .from(positions)
      .where(
        and(inArray(positions.areaId, areaIds), isNull(positions.deletedAt)),
      )
      .orderBy(positions.name),
    db
      .select({ name: departments.name })
      .from(departments)
      .where(
        and(
          inArray(departments.areaId, areaIds),
          isNull(departments.deletedAt),
        ),
      )
      .orderBy(departments.name),
  ]);
  // dedupe (positions may exist in multiple areas with same name)
  const uniq = (arr: { name: string }[]) =>
    Array.from(new Set(arr.map((x) => x.name)));
  return { positions: uniq(pos), departments: uniq(dep) };
}

// Helper to ensure SQL imports are kept tree-shake-safe even if unused
void sql;
