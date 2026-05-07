import { redirect } from "next/navigation";
import { eq, count } from "drizzle-orm";
import { db } from "@/db";
import { departments, employees, areas } from "@/db/schema";
import {
  requireSession,
  getAccessibleAreas,
  assertCanAccessArea,
} from "@/lib/authz";
import { DepartmentsTable } from "./departments-table";

export default async function DepartmentsPage({
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
      id: departments.id,
      name: departments.name,
      employeeCount: count(employees.id),
    })
    .from(departments)
    .leftJoin(employees, eq(employees.departmentId, departments.id))
    .where(eq(departments.areaId, currentAreaId))
    .groupBy(departments.id, departments.name)
    .orderBy(departments.name);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">
          Departments · {areaRow.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Departments belong to the currently selected area.
        </p>
      </div>
      <DepartmentsTable
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
