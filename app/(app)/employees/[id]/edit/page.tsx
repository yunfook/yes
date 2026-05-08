import Link from "next/link";
import { and, eq, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  getAreaSettingDefaults,
  type EmployeeRow,
} from "../../actions";
import { listSalaryTypesByArea } from "../../../salary-types/actions";
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
      areaId: employees.areaId,
      name: employees.name,
      dob: employees.dob,
      gender: employees.gender,
      ic: employees.ic,
      passport: employees.passport,
      nationality: employees.nationality,
      contactNumber: employees.contactNumber,
      email: employees.email,
      totalAnnualLeave: employees.totalAnnualLeave,
      totalSickLeave: employees.totalSickLeave,
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
      salaryType: employees.salaryType,
      salaryHour: employees.salaryHour,
      salaryDay: employees.salaryDay,
      salaryWeek: employees.salaryWeek,
      salaryMonth: employees.salaryMonth,
      otherSalaryTypeId: employees.otherSalaryTypeId,
      hasOvertime: employees.hasOvertime,
      hasRestday: employees.hasRestday,
      hasHoliday: employees.hasHoliday,
      positionId: employees.positionId,
      positionName: positionsTbl.name,
      departmentId: employees.departmentId,
      departmentName: departmentsTbl.name,
    })
    .from(employees)
    .leftJoin(positionsTbl, eq(positionsTbl.id, employees.positionId))
    .leftJoin(departmentsTbl, eq(departmentsTbl.id, employees.departmentId))
    .where(and(eq(employees.id, employeeId), isNull(employees.deletedAt)))
    .limit(1);

  if (!row) notFound();

  const areaId = area ? Number(area) : row.areaId;
  if (!areaId) notFound();

  await assertCanAccessArea(session, areaId);

  const [positions, departments, otherSalaryTypes, config, defaults] =
    await Promise.all([
      listPositionsByArea(areaId),
      listDepartmentsByArea(areaId),
      listSalaryTypesByArea(areaId),
      getEmployeeFormConfig(areaId),
      getAreaSettingDefaults(areaId),
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
        <h1 className="text-2xl font-semibold">Edit - {row.name}</h1>
        <p className="text-sm text-muted-foreground">
          Untick a field to clear it.
        </p>
      </div>
      <Card>
        <CardContent>
      <EmployeeForm
        areaId={areaId}
        positions={positions}
        departments={departments}
        otherSalaryTypes={otherSalaryTypes}
        config={config}
        rates={defaults.rates}
        scheduleDefaults={defaults.schedule}
        existing={{
          id: row.id,
          areaId: row.areaId,
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
          totalAnnualLeave: row.totalAnnualLeave,
          totalSickLeave: row.totalSickLeave,
          restday: row.restday as EmployeeRow["restday"],
          breakType: row.breakType as EmployeeRow["breakType"],
          mondayStart: row.mondayStart,
          mondayEnd: row.mondayEnd,
          mondayBreak: row.mondayBreak,
          tuesdayStart: row.tuesdayStart,
          tuesdayEnd: row.tuesdayEnd,
          tuesdayBreak: row.tuesdayBreak,
          wednesdayStart: row.wednesdayStart,
          wednesdayEnd: row.wednesdayEnd,
          wednesdayBreak: row.wednesdayBreak,
          thursdayStart: row.thursdayStart,
          thursdayEnd: row.thursdayEnd,
          thursdayBreak: row.thursdayBreak,
          fridayStart: row.fridayStart,
          fridayEnd: row.fridayEnd,
          fridayBreak: row.fridayBreak,
          saturdayStart: row.saturdayStart,
          saturdayEnd: row.saturdayEnd,
          saturdayBreak: row.saturdayBreak,
          sundayStart: row.sundayStart,
          sundayEnd: row.sundayEnd,
          sundayBreak: row.sundayBreak,
          salaryType: row.salaryType as EmployeeRow["salaryType"],
          salaryHour: row.salaryHour,
          salaryDay: row.salaryDay,
          salaryWeek: row.salaryWeek,
          salaryMonth: row.salaryMonth,
          otherSalaryTypeId: row.otherSalaryTypeId,
          otherSalaryTypeName: null,
          hasOvertime: row.hasOvertime,
          hasRestday: row.hasRestday,
          hasHoliday: row.hasHoliday,
        }}
      />
        </CardContent>
      </Card>
    </div>
  );
}
