import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { employees, positions, areas } from "@/db/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeftIcon, PencilIcon } from "lucide-react";
import { requireSession, assertCanAccessArea } from "@/lib/authz";

export default async function EmployeeDetailPage({
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
      positionId: employees.positionId,
      positionName: positions.name,
      areaId: positions.areaId,
      areaName: areas.name,
    })
    .from(employees)
    .leftJoin(positions, eq(positions.id, employees.positionId))
    .leftJoin(areas, eq(areas.id, positions.areaId))
    .where(eq(employees.id, employeeId))
    .limit(1);

  if (!row) notFound();

  if (row.areaId) {
    await assertCanAccessArea(session, row.areaId);
  }

  const backHref = area ? `/employees?area=${area}` : "/employees";

  const fields: { label: string; value: string | null }[] = [
    { label: "Date of birth", value: row.dob },
    { label: "Gender", value: row.gender },
    { label: "Position", value: row.positionName ?? null },
    { label: "Area", value: row.areaName ?? null },
    { label: "Nationality", value: row.nationality },
    { label: "IC", value: row.ic },
    { label: "Passport", value: row.passport },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" render={<Link href={backHref} />}>
          <ArrowLeftIcon className="size-4" /> Back
        </Button>
        <Button
          size="sm"
          render={
            <Link
              href={`/employees/${row.id}/edit?area=${row.areaId ?? ""}`}
            />
          }
        >
          <PencilIcon className="size-4" /> Edit
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{row.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.label}>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  {f.label}
                </dt>
                <dd className="text-sm font-medium">
                  {f.value ?? <span className="text-muted-foreground">—</span>}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
