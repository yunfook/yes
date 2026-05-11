import Link from "next/link";
import { and, eq, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import {
  employees,
  positions,
  departments,
  areaSetting,
  payMultiplier,
  otherSalaryType,
} from "@/db/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeftIcon,
  BriefcaseIcon,
  Building2Icon,
  CakeIcon,
  GlobeIcon,
  IdCardIcon,
  MailIcon,
  PencilIcon,
  PhoneIcon,
  UserIcon,
} from "lucide-react";
import { requireSession, assertCanAccessArea } from "@/lib/authz";
import {
  BREAK_SESSION_CLASS,
  RESTDAY_COLUMN_CLASS,
  Timetable,
  WORK_SESSION_CLASS,
  type DayKey,
  type TimetableSession,
} from "@/components/ui/timetable";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

const SALARY_TYPE_LABEL: Record<string, string> = {
  hour: "Hour based",
  monthly: "Monthly paid",
  other: "Other",
};

const ALL_DAYS: DayKey[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

type BreakType = "30m" | "1h" | "2h" | "none";

function InfoField({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  if (value == null) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <dt className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </dt>
        <dd className="text-sm font-medium">{value}</dd>
      </div>
    </div>
  );
}

function renderIdentityDoc(
  nationality: "Local" | "International" | null,
  ic: string | null,
  passport: string | null,
): React.ReactNode {
  if (nationality === "International") return passport;
  if (nationality !== "Local") return null;
  if (!passport) return ic;
  return (
    <div className="flex flex-col gap-0.5">
      {ic && <div>IC: {ic}</div>}
      <div>Passport: {passport}</div>
    </div>
  );
}

function formatMoney(n: number | null): string {
  if (n == null) return "—";
  return n.toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatRm(n: number | null): string {
  if (n == null) return "—";
  return `RM ${formatMoney(n)}`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function fmtRaw(n: number | null): string {
  if (n == null) return "";
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2).replace(/\.?0+$/, "");
}

function parseHM(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function addMinutes(time: string, minutes: number): string {
  const total = parseHM(time) + minutes;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${pad(h)}:${pad(m)}`;
}

function breakMinutes(t: BreakType): number {
  if (t === "30m") return 30;
  if (t === "2h") return 120;
  return 60;
}

function endLabel(time: string): string {
  return time === "00:00" ? "24:00" : time;
}

function endMinutes(time: string): number {
  const v = parseHM(time);
  return v === 0 ? 24 * 60 : v;
}

function dayToSessions(
  day: DayKey,
  workStart: string | null,
  workEnd: string | null,
  breakStart: string | null,
  breakType: BreakType,
): TimetableSession[] {
  if (!workStart || !workEnd) return [];
  const ws = parseHM(workStart);
  const we = endMinutes(workEnd);
  if (we <= ws) return [];
  const weLabel = endLabel(workEnd);
  if (breakType === "none" || !breakStart) {
    return [
      { day, start: workStart, end: weLabel, title: "Work", className: WORK_SESSION_CLASS },
    ];
  }
  const bs = parseHM(breakStart);
  const breakEnd = addMinutes(breakStart, breakMinutes(breakType));
  const be = parseHM(breakEnd);
  if (be <= bs || bs < ws || be > we) {
    return [
      { day, start: workStart, end: weLabel, title: "Work", className: WORK_SESSION_CLASS },
    ];
  }
  return [
    { day, start: workStart, end: breakStart, title: "Work", className: WORK_SESSION_CLASS },
    { day, start: breakStart, end: breakEnd, title: "Break", className: BREAK_SESSION_CLASS },
    { day, start: breakEnd, end: weLabel, title: "Work", className: WORK_SESSION_CLASS },
  ];
}

export default async function EmployeeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ area?: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const { area } = await searchParams;
  const employeeId = Number(id);
  if (!Number.isFinite(employeeId)) notFound();

  const [row] = await db
    .select({
      id: employees.id,
      name: employees.name,
      dob: employees.dob,
      gender: employees.gender,
      ic: employees.ic,
      passport: employees.passport,
      nationality: employees.nationality,
      contactNumber: employees.contactNumber,
      email: employees.email,
      positionName: positions.name,
      departmentName: departments.name,
      areaId: employees.areaId,
      salaryType: employees.salaryType,
      salaryHour: employees.salaryHour,
      salaryMonth: employees.salaryMonth,
      otherSalaryTypeName: otherSalaryType.name,
      hasOvertime: employees.hasOvertime,
      hasRestday: employees.hasRestday,
      hasHoliday: employees.hasHoliday,
      hasDouble: employees.hasDouble,
      hasTriple: employees.hasTriple,
      hoursPerDay: employees.hoursPerDay,
      daysPerMonth: employees.daysPerMonth,
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
      otRate: payMultiplier.otRate,
      rdRate: payMultiplier.rdRate,
      phRate: payMultiplier.phRate,
    })
    .from(employees)
    .leftJoin(positions, eq(positions.id, employees.positionId))
    .leftJoin(departments, eq(departments.id, employees.departmentId))
    .leftJoin(areaSetting, eq(areaSetting.areaId, employees.areaId))
    .leftJoin(payMultiplier, eq(payMultiplier.areaId, employees.areaId))
    .leftJoin(
      otherSalaryType,
      eq(otherSalaryType.id, employees.otherSalaryTypeId),
    )
    .where(and(eq(employees.id, employeeId), isNull(employees.deletedAt)))
    .limit(1);

  if (!row) notFound();

  if (row.areaId) {
    await assertCanAccessArea(session, row.areaId);
  }

  const backHref = area ? `/employees?area=${area}` : "/employees";

  const otRate = row.otRate ?? 1.5;
  const rdRate = row.rdRate ?? 2;
  const phRate = row.phRate ?? 3;
  const showOt = row.hasOvertime === true;
  const showRd = row.hasRestday === true;
  const showPh = row.hasHoliday === true;
  const showDb = row.hasDouble === true;
  const showTp = row.hasTriple === true;
  const ot = row.salaryHour != null && showOt ? row.salaryHour * otRate : null;
  const rd = row.salaryHour != null && showRd ? row.salaryHour * rdRate : null;
  const ph = row.salaryHour != null && showPh ? row.salaryHour * phRate : null;
  const dbl = row.salaryHour != null && showDb ? row.salaryHour * 2 : null;
  const tpl = row.salaryHour != null && showTp ? row.salaryHour * 3 : null;

  const restdaySet = new Set(row.restday ?? []);
  const breakType: BreakType = (row.breakType as BreakType | null) ?? "1h";
  const dayData: Record<
    DayKey,
    { start: string | null; end: string | null; brk: string | null }
  > = {
    monday: { start: row.mondayStart, end: row.mondayEnd, brk: row.mondayBreak },
    tuesday: {
      start: row.tuesdayStart,
      end: row.tuesdayEnd,
      brk: row.tuesdayBreak,
    },
    wednesday: {
      start: row.wednesdayStart,
      end: row.wednesdayEnd,
      brk: row.wednesdayBreak,
    },
    thursday: {
      start: row.thursdayStart,
      end: row.thursdayEnd,
      brk: row.thursdayBreak,
    },
    friday: {
      start: row.fridayStart,
      end: row.fridayEnd,
      brk: row.fridayBreak,
    },
    saturday: {
      start: row.saturdayStart,
      end: row.saturdayEnd,
      brk: row.saturdayBreak,
    },
    sunday: {
      start: row.sundayStart,
      end: row.sundayEnd,
      brk: row.sundayBreak,
    },
  };
  const sessions: TimetableSession[] = ALL_DAYS.flatMap((d) =>
    restdaySet.has(d)
      ? []
      : dayToSessions(d, dayData[d].start, dayData[d].end, dayData[d].brk, breakType),
  );
  const dayClassName: Partial<Record<DayKey, string>> = Object.fromEntries(
    ALL_DAYS.filter((d) => restdaySet.has(d)).map((d) => [d, RESTDAY_COLUMN_CLASS]),
  );

  const activeStarts: number[] = [];
  const activeEnds: number[] = [];
  for (const d of ALL_DAYS) {
    if (restdaySet.has(d)) continue;
    const s = dayData[d].start;
    const e = dayData[d].end;
    if (s) activeStarts.push(parseHM(s));
    if (e) activeEnds.push(endMinutes(e));
  }
  const PAD = 2 * 60;
  const startMin =
    activeStarts.length > 0
      ? Math.max(0, Math.min(...activeStarts) - PAD)
      : 0;
  const endMin =
    activeEnds.length > 0
      ? Math.min(23 * 60, Math.max(...activeEnds) + PAD)
      : 23 * 60;
  const tableStartTime = `${pad(Math.floor(startMin / 60))}:${pad(startMin % 60)}`;
  const tableEndTime = `${pad(Math.floor(endMin / 60))}:${pad(endMin % 60)}`;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button variant="ghost" size="sm" render={<Link href={backHref} />}>
          <ArrowLeftIcon className="size-4" /> Back
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">
          Employee Detail - {row.name}
        </h1>
        <Button
          size="sm"
          render={
            <Link
              href={`/employees/${row.id}/edit?area=${row.areaId ?? ""}`}
            />
          }
        >
          <PencilIcon className="size-4" /> Edit
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <InfoField
              icon={PhoneIcon}
              label="Contact"
              value={row.contactNumber}
            />
            <InfoField icon={MailIcon} label="Email" value={row.email} />
            <InfoField
              icon={CakeIcon}
              label="Date of birth"
              value={row.dob}
            />
            <InfoField icon={UserIcon} label="Gender" value={row.gender} />
            <InfoField
              icon={GlobeIcon}
              label="Nationality"
              value={row.nationality}
            />
            <InfoField
              icon={IdCardIcon}
              label="IC / Passport"
              value={renderIdentityDoc(row.nationality, row.ic, row.passport)}
            />
            <InfoField
              icon={Building2Icon}
              label="Department"
              value={row.departmentName}
            />
            <InfoField
              icon={BriefcaseIcon}
              label="Position"
              value={row.positionName}
            />
          </dl>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Salary</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              if (row.salaryType == null) {
                return <p className="text-sm text-muted-foreground">—</p>;
              }
              if (row.salaryType === "other") {
                return (
                  <div className="text-sm">
                    <span className="font-medium">
                      {SALARY_TYPE_LABEL.other}:{" "}
                    </span>
                    {row.otherSalaryTypeName ?? "—"}
                  </div>
                );
              }
              const hpd = row.hoursPerDay;
              const dpm = row.daysPerMonth;
              const dayValue =
                row.salaryType === "hour"
                  ? row.salaryHour != null && hpd != null
                    ? round2(row.salaryHour * hpd)
                    : null
                  : row.salaryMonth != null && dpm != null
                    ? round2(row.salaryMonth / dpm)
                    : null;
              const hourStr = fmtRaw(row.salaryHour);
              const dayStr = fmtRaw(dayValue);
              const monthStr = fmtRaw(row.salaryMonth);
              const basicRows =
                row.salaryType === "hour"
                  ? [
                      { label: "Hour", hint: "", value: row.salaryHour },
                      hpd != null && {
                        label: "Day",
                        hint: hourStr ? `${hourStr}x${hpd}` : `h×${hpd}`,
                        value: dayValue,
                      },
                    ].filter(Boolean) as {
                      label: string;
                      hint: string;
                      value: number | null;
                    }[]
                  : ([
                      { label: "Monthly", hint: "", value: row.salaryMonth },
                      dpm != null && {
                        label: "Day",
                        hint: monthStr ? `${monthStr}/${dpm}` : `m/${dpm}`,
                        value: dayValue,
                      },
                      hpd != null && {
                        label: "Hour",
                        hint: dayStr ? `${dayStr}/${hpd}` : `d/${hpd}`,
                        value: row.salaryHour,
                      },
                    ].filter(Boolean) as {
                      label: string;
                      hint: string;
                      value: number | null;
                    }[]);
              const allMultiplierRows = [
                {
                  show: showOt,
                  label: "Overtime",
                  hint: hourStr ? `${hourStr}x${otRate}` : `hx${otRate}`,
                  value: ot,
                },
                {
                  show: showRd,
                  label: "Restday",
                  hint: hourStr ? `${hourStr}x${rdRate}` : `hx${rdRate}`,
                  value: rd,
                },
                {
                  show: showPh,
                  label: "Public Holiday",
                  hint: hourStr ? `${hourStr}x${phRate}` : `hx${phRate}`,
                  value: ph,
                },
                {
                  show: showDb,
                  label: "Double pay",
                  hint: hourStr ? `${hourStr}x2` : `hx2`,
                  value: dbl,
                },
                {
                  show: showTp,
                  label: "Triple pay",
                  hint: hourStr ? `${hourStr}x3` : `hx3`,
                  value: tpl,
                },
              ];
              const multiplierRows = allMultiplierRows.filter((r) => r.show);
              const renderTable = (
                title: string,
                rows: { label: string; hint: string; value: number | null }[],
              ) => (
                <div className="flex flex-col gap-1.5">
                  <div className="text-sm font-medium">{title}</div>
                  <Table className="table-fixed">
                    <TableBody>
                      {rows.map((r) => (
                        <TableRow key={r.label}>
                          <TableCell className="w-1/3 font-normal">
                            {r.label}
                          </TableCell>
                          <TableCell className="w-1/3 text-center text-xs text-muted-foreground">
                            {r.hint}
                          </TableCell>
                          <TableCell className="w-1/3 text-right tabular-nums">
                            {formatRm(r.value)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              );
              return (
                <div className="flex flex-col gap-4">
                  {renderTable(
                    SALARY_TYPE_LABEL[row.salaryType] ?? row.salaryType,
                    basicRows,
                  )}
                  {multiplierRows.length > 0 && (
                    <>
                      <Separator />
                      {renderTable("Multiplier", multiplierRows)}
                    </>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            {row.restday == null ? (
              <p className="text-sm text-muted-foreground">—</p>
            ) : (
              <Timetable
                startTime={tableStartTime}
                endTime={tableEndTime}
                minutesPerRow={60}
                rowHeight={26}
                sessions={sessions}
                dayClassName={dayClassName}
                fluid
                timeOnLine
                className="max-h-[24rem]"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
