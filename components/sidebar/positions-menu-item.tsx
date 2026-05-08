"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { BriefcaseIcon } from "lucide-react";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { PositionsDialog } from "@/app/(app)/positions/positions-dialog";

export function PositionsMenuItem({
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
        <SidebarMenuButton onClick={() => setOpen(true)} tooltip="Positions">
          <BriefcaseIcon />
          <span>Positions</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <PositionsDialog
        open={open}
        onOpenChange={setOpen}
        areaId={areaId}
        areaName={areaName}
      />
    </>
  );
}
