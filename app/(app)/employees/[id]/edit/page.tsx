import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import {
  employees,
  positions as positionsTbl,
  departments as departmentsTbl,
} from "@/db/schema";
import { requireSession, assertCanAccessArea } from "@/lib/authz";
import {
  listPositionsByArea,
  listDepartmentsByArea,
  getEmployeeFormConfig,
  getAreaSettingRates,
  type EmployeeRow,
} from "../../actions";
import { EmployeeForm } from "../../employee-form";

export default async function EditEmployeePage({
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
      restday: employees.restday,
      salaryType: employees.salaryType,
      salaryHour: employees.salaryHour,
      salaryDay: employees.salaryDay,
      salaryMonth: employees.salaryMonth,
      salaryOther: employees.salaryOther,
      positionId: employees.positionId,
      positionName: positionsTbl.name,
      departmentId: employees.departmentId,
      departmentName: departmentsTbl.name,
      areaId: positionsTbl.areaId,
    })
    .from(employees)
    .leftJoin(positionsTbl, eq(positionsTbl.id, employees.positionId))
    .leftJoin(departmentsTbl, eq(departmentsTbl.id, employees.departmentId))
    .where(eq(employees.id, employeeId))
    .limit(1);

  if (!row) notFound();

  const areaId = area ? Number(area) : (row.areaId ?? null);
  if (!areaId) notFound();

  await assertCanAccessArea(session, areaId);

  const [positions, departments, config, rates] = await Promise.all([
    listPositionsByArea(areaId),
    listDepartmentsByArea(areaId),
    getEmployeeFormConfig(areaId),
    getAreaSettingRates(areaId),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          render={<Link href={`/employees/${row.id}?area=${areaId}`} />}
        >
          <ArrowLeftIcon className="size-4" /> Back
        </Button>
      </div>
      <div>
        <h1 className="text-2xl font-semibold">Edit · {row.name}</h1>
        <p className="text-sm text-muted-foreground">
          Untick a field to clear it.
        </p>
      </div>
      <EmployeeForm
        areaId={areaId}
        positions={positions}
        departments={departments}
        config={config}
        rates={rates}
        existing={{
          id: row.id,
          name: row.name,
          dob: row.dob,
          gender: row.gender,
          positionId: row.positionId,
          positionName: row.positionName,
          departmentId: row.departmentId,
          departmentName: row.departmentName,
          ic: row.ic,
          passport: row.passport,
          nationality: row.nationality,
          contactNumber: row.contactNumber,
          email: row.email,
          restday: row.restday as EmployeeRow["restday"],
          salaryType: row.salaryType as EmployeeRow["salaryType"],
          salaryHour: row.salaryHour,
          salaryDay: row.salaryDay,
          salaryMonth: row.salaryMonth,
          salaryOther: row.salaryOther,
        }}
      />
    </div>
  );
}
