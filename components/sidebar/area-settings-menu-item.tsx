"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { SettingsIcon } from "lucide-react";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { AreaSettingDialog } from "@/app/(app)/area-settings/area-setting-dialog";

export function AreaSettingsMenuItem({
  areas,
}: {
  areas: { id: number; name: string }[];
}) {
  const searchParams = useSearchParams();
  const area = searchParams.get("area");
  const areaId = area ? Number(area) : (areas[0]?.id ?? null);
  const areaName = areas.find((a) => a.id === areaId)?.name;
  const [open, setOpen] = React.useState(false);

  if (!areaId) return null;

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => setOpen(true)}
          tooltip="Area Settings"
        >
          <SettingsIcon />
          <span>Area Settings</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <AreaSettingDialog
        open={open}
        onOpenChange={setOpen}
        areaId={areaId}
        areaName={areaName}
      />
    </>
  );
}
