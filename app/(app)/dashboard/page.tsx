import { and, eq, isNull } from "drizzle-orm";
import { BriefcaseIcon, Building2Icon, UsersIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/db";
import {
  areas as areasTable,
  departments,
  employees,
  positions,
  otherSalaryType,
} from "@/db/schema";
import {
  assertCanAccessArea,
  getAccessibleAreas,
  requireSession,
} from "@/lib/authz";
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
      <CardContent>
        <div className="text-3xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string }>;
}) {
  const session = await requireSession();
  const { area } = await searchParams;
  const accessible = await getAccessibleAreas(session);
  const currentAreaId = area ? Number(area) : (accessible[0]?.id ?? null);

  if (!currentAreaId) {
    return (
      <div className="text-sm text-muted-foreground">
        No areas accessible. Ask an admin to assign you to an area.
      </div>
    );
  }
  await assertCanAccessArea(session, currentAreaId);

  const [areaRow, empRows, depts, poss] = await Promise.all([
    db
      .select({ name: areasTable.name })
      .from(areasTable)
      .where(
        and(eq(areasTable.id, currentAreaId), isNull(areasTable.deletedAt)),
      )
      .limit(1)
      .then((r) => r[0] ?? null),
    db
      .select({
        gender: employees.gender,
        nationality: employees.nationality,
        positionName: positions.name,
        departmentName: departments.name,
        salaryType: employees.salaryType,
        otherSalaryTypeName: otherSalaryType.name,
        restday: employees.restday,
      })
      .from(employees)
      .leftJoin(positions, eq(positions.id, employees.positionId))
      .leftJoin(departments, eq(departments.id, employees.departmentId))
      .leftJoin(
        otherSalaryType,
        eq(otherSalaryType.id, employees.otherSalaryTypeId),
      )
      .where(
        and(eq(employees.areaId, currentAreaId), isNull(employees.deletedAt)),
      ),
    db
      .select({ id: departments.id })
      .from(departments)
      .where(
        and(
          eq(departments.areaId, currentAreaId),
          isNull(departments.deletedAt),
        ),
      ),
    db
      .select({ id: positions.id })
      .from(positions)
      .where(
        and(eq(positions.areaId, currentAreaId), isNull(positions.deletedAt)),
      ),
  ]);

  const gender: Record<string, number> = { Male: 0, Female: 0, "Not set": 0 };
  const nationality: Record<string, number> = {
    Local: 0,
    International: 0,
    "Not set": 0,
  };
  const positionMap: Record<string, number> = {};
  const departmentMap: Record<string, number> = {};
  const salaryType: Record<string, number> = {
    hour: 0,
    monthly: 0,
    "Not set": 0,
  };
  for (const e of empRows) {
    gender[e.gender ?? "Not set"]++;
    nationality[e.nationality ?? "Not set"]++;
    const p = e.positionName ?? "Unassigned";
    positionMap[p] = (positionMap[p] ?? 0) + 1;
    const d = e.departmentName ?? "Unassigned";
    departmentMap[d] = (departmentMap[d] ?? 0) + 1;
    if (e.salaryType === "other") {
      const key = e.otherSalaryTypeName ?? "Other";
      salaryType[key] = (salaryType[key] ?? 0) + 1;
    } else {
      salaryType[e.salaryType ?? "Not set"]++;
    }
  }

  const restdayData = WEEKDAYS.map((day) => {
    let working = 0;
    let resting = 0;
    for (const e of empRows) {
      if (!e.restday) continue;
      if (e.restday.includes("none")) {
        working++;
      } else if (e.restday.includes(day)) {
        resting++;
      } else {
        working++;
      }
    }
    return { day, working, resting };
  });

  const toData = (m: Record<string, number>): ChartDatum[] =>
    Object.entries(m)
      .filter(([k, v]) => v > 0 && k !== "Not set" && k !== "Unassigned")
      .map(([label, count]) => ({ label, count }));

  const data: DashboardData = {
    gender: toData(gender),
    nationality: toData(nationality),
    positions: toData(positionMap),
    departments: toData(departmentMap),
    salaryType: toData(salaryType),
    restday: restdayData,
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Dashboard - {areaRow?.name ?? "—"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Live snapshot of the selected area.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total employees"
          value={empRows.length}
          icon={UsersIcon}
        />
        <StatCard
          title="Total departments"
          value={depts.length}
          icon={Building2Icon}
        />
        <StatCard
          title="Total positions"
          value={poss.length}
          icon={BriefcaseIcon}
        />
      </div>

      <DashboardCharts data={data} />
    </div>
  );
}
