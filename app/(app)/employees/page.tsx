import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { areas } from "@/db/schema";
import {
  requireSession,
  getAccessibleAreas,
  assertCanAccessArea,
} from "@/lib/authz";
import { EmployeesClient } from "./employees-client";
import { listEmployeesByArea } from "./actions";

export default async function EmployeesPage({
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

  const [areaRow, initialEmployees] = await Promise.all([
    db
      .select()
      .from(areas)
      .where(and(eq(areas.id, currentAreaId), isNull(areas.deletedAt)))
      .limit(1)
      .then((r) => r[0] ?? null),
    listEmployeesByArea(currentAreaId),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Employees - {areaRow?.name ?? "—"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Filterable, sortable. Switch areas in the sidebar.
        </p>
      </div>
      <EmployeesClient areaId={currentAreaId} initialData={initialEmployees} />
    </div>
  );
}
