import { Suspense } from "react";
import { notFound } from "next/navigation";
import { and, eq, isNull, sql } from "drizzle-orm";
import { BriefcaseIcon, Building2Icon, UsersIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/db";
import {
  departments,
  employees,
  positions,
  otherSalaryType,
} from "@/db/schema";
import { getAccessibleAreas, requireSession } from "@/lib/authz";
import {
  DashboardCharts,
  type ChartDatum,
  type DashboardData,
} from "./dashboard-charts";

const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="text-muted-foreground">
        <div className="text-3xl font-semibold text-primary">{value}</div>
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-16 animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
    </div>
  );
}

function ChartsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-[260px] animate-pulse rounded-md bg-muted" />
      ))}
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string }>;
}) {
  const [session, { area }] = await Promise.all([
    requireSession(),
    searchParams,
  ]);
  const accessible = await getAccessibleAreas(session);
  const requestedId = area ? Number(area) : null;
  const currentArea =
    (requestedId !== null
      ? accessible.find((a) => a.id === requestedId)
      : accessible[0]) ?? null;

  if (!currentArea) {
    if (accessible.length === 0) {
      return (
        <div className="text-sm text-muted-foreground">
          No areas accessible. Ask an admin to assign you to an area.
        </div>
      );
    }
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Dashboard - {currentArea.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Live snapshot of the selected area.
        </p>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <Stats areaId={currentArea.id} />
      </Suspense>

      <Suspense fallback={<ChartsSkeleton />}>
        <Charts areaId={currentArea.id} />
      </Suspense>
    </div>
  );
}

async function Stats({ areaId }: { areaId: number }) {
  const [empCount, deptCount, posCount] = await Promise.all([
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(employees)
      .where(and(eq(employees.areaId, areaId), isNull(employees.deletedAt)))
      .then((r) => r[0]?.c ?? 0),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(departments)
      .where(and(eq(departments.areaId, areaId), isNull(departments.deletedAt)))
      .then((r) => r[0]?.c ?? 0),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(positions)
      .where(and(eq(positions.areaId, areaId), isNull(positions.deletedAt)))
      .then((r) => r[0]?.c ?? 0),
  ]);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard title="Total employees" value={empCount} icon={UsersIcon} />
      <StatCard title="Total departments" value={deptCount} icon={Building2Icon} />
      <StatCard title="Total positions" value={posCount} icon={BriefcaseIcon} />
    </div>
  );
}

async function Charts({ areaId }: { areaId: number }) {
  const where = and(eq(employees.areaId, areaId), isNull(employees.deletedAt));

  const [
    genderRows,
    nationalityRows,
    positionRows,
    departmentRows,
    salaryRows,
    restdayRow,
    deptTotal,
    posTotal,
  ] = await Promise.all([
    db
      .select({ key: employees.gender, c: sql<number>`count(*)::int` })
      .from(employees)
      .where(where)
      .groupBy(employees.gender),
    db
      .select({ key: employees.nationality, c: sql<number>`count(*)::int` })
      .from(employees)
      .where(where)
      .groupBy(employees.nationality),
    db
      .select({ name: positions.name, c: sql<number>`count(*)::int` })
      .from(employees)
      .innerJoin(positions, eq(positions.id, employees.positionId))
      .where(where)
      .groupBy(positions.name),
    db
      .select({ name: departments.name, c: sql<number>`count(*)::int` })
      .from(employees)
      .innerJoin(departments, eq(departments.id, employees.departmentId))
      .where(where)
      .groupBy(departments.name),
    db
      .select({
        key: sql<string | null>`CASE WHEN ${employees.salaryType} = 'other' THEN ${otherSalaryType.name} ELSE ${employees.salaryType} END`,
        c: sql<number>`count(*)::int`,
      })
      .from(employees)
      .leftJoin(
        otherSalaryType,
        eq(otherSalaryType.id, employees.otherSalaryTypeId),
      )
      .where(where)
      .groupBy(sql`1`),
    db
      .select({
        mon_rest: sql<number>`count(*) FILTER (WHERE 'monday' = ANY(${employees.restday}) AND NOT ('none' = ANY(${employees.restday})))::int`,
        tue_rest: sql<number>`count(*) FILTER (WHERE 'tuesday' = ANY(${employees.restday}) AND NOT ('none' = ANY(${employees.restday})))::int`,
        wed_rest: sql<number>`count(*) FILTER (WHERE 'wednesday' = ANY(${employees.restday}) AND NOT ('none' = ANY(${employees.restday})))::int`,
        thu_rest: sql<number>`count(*) FILTER (WHERE 'thursday' = ANY(${employees.restday}) AND NOT ('none' = ANY(${employees.restday})))::int`,
        fri_rest: sql<number>`count(*) FILTER (WHERE 'friday' = ANY(${employees.restday}) AND NOT ('none' = ANY(${employees.restday})))::int`,
        sat_rest: sql<number>`count(*) FILTER (WHERE 'saturday' = ANY(${employees.restday}) AND NOT ('none' = ANY(${employees.restday})))::int`,
        sun_rest: sql<number>`count(*) FILTER (WHERE 'sunday' = ANY(${employees.restday}) AND NOT ('none' = ANY(${employees.restday})))::int`,
        scheduled: sql<number>`count(*) FILTER (WHERE ${employees.restday} IS NOT NULL)::int`,
      })
      .from(employees)
      .where(where)
      .then((r) => r[0]),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(departments)
      .where(
        and(eq(departments.areaId, areaId), isNull(departments.deletedAt)),
      )
      .then((r) => r[0]?.c ?? 0),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(positions)
      .where(and(eq(positions.areaId, areaId), isNull(positions.deletedAt)))
      .then((r) => r[0]?.c ?? 0),
  ]);

  const toData = <T extends { c: number }>(
    rows: T[],
    getLabel: (row: T) => string | null | undefined,
  ): ChartDatum[] =>
    rows
      .filter((r) => {
        const label = getLabel(r);
        return r.c > 0 && label != null && label !== "";
      })
      .map((r) => ({ label: getLabel(r) as string, count: r.c }));

  const scheduled = restdayRow?.scheduled ?? 0;
  const restdayPerDay: Record<string, number> = {
    monday: restdayRow?.mon_rest ?? 0,
    tuesday: restdayRow?.tue_rest ?? 0,
    wednesday: restdayRow?.wed_rest ?? 0,
    thursday: restdayRow?.thu_rest ?? 0,
    friday: restdayRow?.fri_rest ?? 0,
    saturday: restdayRow?.sat_rest ?? 0,
    sunday: restdayRow?.sun_rest ?? 0,
  };
  const restdayData = WEEKDAYS.map((day) => {
    const resting = restdayPerDay[day];
    return { day, working: scheduled - resting, resting };
  });

  const data: DashboardData = {
    gender: toData(genderRows, (r) => r.key),
    nationality: toData(nationalityRows, (r) => r.key),
    positions: toData(positionRows, (r) => r.name),
    departments: toData(departmentRows, (r) => r.name),
    salaryType: toData(salaryRows, (r) => r.key),
    restday: restdayData,
  };

  return (
    <DashboardCharts data={data} deptTotal={deptTotal} posTotal={posTotal} />
  );
}
