import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { employees, areas as areasTable, positions } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { requireSession, getAccessibleAreas, assertCanAccessArea } from "@/lib/authz";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string }>;
}) {
  const session = await requireSession();
  const { area } = await searchParams;
  const accessible = await getAccessibleAreas(session);
  const currentAreaId = area
    ? Number(area)
    : (accessible[0]?.id ?? null);

  let employeeCount = 0;
  let positionCount = 0;
  let currentAreaName = "—";

  if (currentAreaId) {
    await assertCanAccessArea(session, currentAreaId);
    const [areaRow] = await db
      .select()
      .from(areasTable)
      .where(eq(areasTable.id, currentAreaId))
      .limit(1);
    currentAreaName = areaRow?.name ?? "—";

    const [posCount] = await db
      .select({ c: count() })
      .from(positions)
      .where(eq(positions.areaId, currentAreaId));
    positionCount = posCount?.c ?? 0;

    const [empCount] = await db
      .select({ c: count() })
      .from(employees)
      .innerJoin(positions, eq(positions.id, employees.positionId))
      .where(eq(positions.areaId, currentAreaId));
    employeeCount = empCount?.c ?? 0;
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Current area</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">{currentAreaName}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Employees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">{employeeCount}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">{positionCount}</div>
        </CardContent>
      </Card>
    </div>
  );
}
