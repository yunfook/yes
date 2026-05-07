import { sql, eq } from "drizzle-orm";
import { db } from "@/db";
import { areas, employees, positions } from "@/db/schema";
import { requireAdmin } from "@/lib/authz";
import { AreasTable } from "./areas-table";

export default async function AreasAdminPage() {
  await requireAdmin();

  const rows = await db
    .select({
      id: areas.id,
      name: areas.name,
      positionCount: sql<number>`coalesce(count(distinct ${positions.id}), 0)`.as(
        "positionCount",
      ),
      employeeCount: sql<number>`coalesce(count(distinct ${employees.id}), 0)`.as(
        "employeeCount",
      ),
    })
    .from(areas)
    .leftJoin(positions, eq(positions.areaId, areas.id))
    .leftJoin(employees, eq(employees.positionId, positions.id))
    .groupBy(areas.id, areas.name)
    .orderBy(areas.name);

  const items = rows.map((r) => ({
    id: r.id,
    name: r.name,
    positionCount: Number(r.positionCount ?? 0),
    employeeCount: Number(r.employeeCount ?? 0),
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Areas</h1>
          <p className="text-sm text-muted-foreground">
            Top-level grouping. Counts are derived live.
          </p>
        </div>
      </div>
      <AreasTable items={items} />
    </div>
  );
}
