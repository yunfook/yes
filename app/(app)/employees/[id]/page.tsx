import Link from "next/link";
import { and, eq, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import {
  employees,
  positions,
  departments,
  areaSetting,
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
  Timetable,
  type DayKey,
  type TimetableSession,
} from "@/components/ui/timetable";

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

function CurrencyField({
  label,
  hint,
  value,
}: {
  label: string;
  hint?: string;
  value: number | null;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span>{label}</span>
        {hint && (
          <span className="text-xs font-normal text-muted-foreground">
            {hint}
          </span>
        )}
      </div>
      <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm tabular-nums">
        {formatMoney(value)}
      </div>
    </div>
  );
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
    return [{ day, start: workStart, end: weLabel, title: "Work" }];
  }
  const bs = parseHM(breakStart);
  const breakEnd = addMinutes(breakStart, breakMinutes(breakType));
  const be = parseHM(breakEnd);
  if (be <= bs || bs < ws || be > we) {
    return [{ day, start: workStart, end: weLabel, title: "Work" }];
  }
  return [
    { day, start: workStart, end: breakStart, title: "Work" },
    {
      day,
      start: breakStart,
      end: breakEnd,
      title: "Break",
      className:
        "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-800",
    },
    { day, start: breakEnd, end: weLabel, title: "Work" },
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
      salaryDay: employees.salaryDay,
      salaryWeek: employees.salaryWeek,
      salaryMonth: employees.salaryMonth,
      otherSalaryTypeName: otherSalaryType.name,
      hasOvertime: employees.hasOvertime,
      hasRestday: employees.hasRestday,
      hasHoliday: employees.hasHoliday,
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
      otRate: areaSetting.otRate,
      rdRate: areaSetting.rdRate,
      phRate: areaSetting.phRate,
    })
    .from(employees)
    .leftJoin(positions, eq(positions.id, employees.positionId))
    .leftJoin(departments, eq(departments.id, employees.departmentId))
    .leftJoin(areaSetting, eq(areaSetting.areaId, employees.areaId))
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
  const ot =
    row.salaryHour != null && row.hasOvertime ? row.salaryHour * otRate : null;
  const rd =
    row.salaryHour != null && row.hasRestday ? row.salaryHour * rdRate : null;
  const ph =
    row.salaryHour != null && row.hasHoliday ? row.salaryHour * phRate : null;

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
        <CardContent className="pt-6">
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
            {row.salaryType == null ? (
              <p className="text-sm text-muted-foreground">—</p>
            ) : row.salaryType === "other" ? (
              <div className="text-sm font-medium">
                {SALARY_TYPE_LABEL.other} : {row.otherSalaryTypeName ?? "—"}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="text-sm font-medium">
                  {SALARY_TYPE_LABEL[row.salaryType] ?? row.salaryType}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <CurrencyField label="Hour" value={row.salaryHour} />
                  <CurrencyField label="Day" value={row.salaryDay} />
                  {row.salaryType === "hour" ? (
                    <CurrencyField label="Week" value={row.salaryWeek} />
                  ) : (
                    <CurrencyField label="Monthly" value={row.salaryMonth} />
                  )}
                  <CurrencyField
                    label="Overtime"
                    hint={`hx${otRate}`}
                    value={ot}
                  />
                  <CurrencyField
                    label="Restday"
                    hint={`hx${rdRate}`}
                    value={rd}
                  />
                  <CurrencyField
                    label="Public Holiday"
                    hint={`hx${phRate}`}
                    value={ph}
                  />
                </div>
              </div>
            )}
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
                startTime="00:00"
                endTime="23:00"
                minutesPerRow={60}
                rowHeight={22}
                sessions={sessions}
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
