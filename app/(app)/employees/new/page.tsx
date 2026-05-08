import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { redirect } from "next/navigation";
import {
  requireSession,
  getAccessibleAreas,
  assertCanAccessArea,
} from "@/lib/authz";
import {
  listPositionsByArea,
  listDepartmentsByArea,
  getEmployeeFormConfig,
  getAreaSettingDefaults,
} from "../actions";
import { listSalaryTypesByArea } from "../../salary-types/actions";
import { EmployeeForm } from "../employee-form";
import { EmployeeFormSettingsDialog } from "../employee-form-settings-dialog";

export default async function NewEmployeePage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string }>;
}) {
  const session = await requireSession();
  const { area } = await searchParams;
  const accessible = await getAccessibleAreas(session);
  const currentAreaId = area ? Number(area) : (accessible[0]?.id ?? null);

  if (!currentAreaId) redirect("/dashboard");
  await assertCanAccessArea(session, currentAreaId);

  const [positions, departments, otherSalaryTypes, config, defaults] =
    await Promise.all([
      listPositionsByArea(currentAreaId),
      listDepartmentsByArea(currentAreaId),
      listSalaryTypesByArea(currentAreaId),
      getEmployeeFormConfig(currentAreaId),
      getAreaSettingDefaults(currentAreaId),
    ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          render={<Link href={`/employees?area=${currentAreaId}`} />}
        >
          <ArrowLeftIcon className="size-4" /> Back
        </Button>
        <h1 className="text-lg font-semibold">Create New User</h1>
        <EmployeeFormSettingsDialog areaId={currentAreaId} config={config} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>New employee</CardTitle>
          <CardDescription>
            Tick a field to enable it. Untouched fields are left blank.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmployeeForm
            areaId={currentAreaId}
            positions={positions}
            departments={departments}
            otherSalaryTypes={otherSalaryTypes}
            config={config}
            rates={defaults.rates}
            scheduleDefaults={defaults.schedule}
          />
        </CardContent>
      </Card>
    </div>
  );
}
