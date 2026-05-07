import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { areas } from "@/db/schema";
import {
  requireSession,
  getAccessibleAreas,
  assertCanAccessArea,
} from "@/lib/authz";
import { getAreaSetting } from "./actions";
import { AreaSettingForm } from "./area-setting-form";

export default async function AreaSettingsPage({
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

  const setting = await getAreaSetting(currentAreaId);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">
          Area Settings · {areaRow.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Multipliers used to compute overtime, rest day, and public holiday
          pay for this area.
        </p>
      </div>
      <AreaSettingForm areaId={currentAreaId} initial={setting} />
    </div>
  );
}
