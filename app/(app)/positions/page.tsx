import { redirect } from "next/navigation";
import { eq, count } from "drizzle-orm";
import { db } from "@/db";
import { positions, employees, areas } from "@/db/schema";
import {
  requireSession,
  getAccessibleAreas,
  assertCanAccessArea,
} from "@/lib/authz";
import { PositionsTable } from "./positions-table";

export default async function PositionsPage({
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

  const [areaRow] = await db
    .select()
    .from(areas)
    .where(eq(areas.id, currentAreaId))
    .limit(1);
  if (!areaRow) redirect("/dashboard");

  const rows = await db
    .select({
      id: positions.id,
      name: positions.name,
      employeeCount: count(employees.id),
    })
    .from(positions)
    .leftJoin(employees, eq(employees.positionId, positions.id))
    .where(eq(positions.areaId, currentAreaId))
    .groupBy(positions.id, positions.name)
    .orderBy(positions.name);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Positions · {areaRow.name}</h1>
        <p className="text-sm text-muted-foreground">
          Positions belong to the currently selected area.
        </p>
      </div>
      <PositionsTable
        items={rows.map((r) => ({
          id: r.id,
          name: r.name,
          employeeCount: Number(r.employeeCount ?? 0),
        }))}
        areaId={currentAreaId}
      />
    </div>
  );
}
