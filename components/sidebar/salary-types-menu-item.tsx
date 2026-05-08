"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { CoinsIcon } from "lucide-react";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { SalaryTypesDialog } from "@/app/(app)/salary-types/salary-types-dialog";

export function SalaryTypesMenuItem({
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
        <SidebarMenuButton onClick={() => setOpen(true)} tooltip="Salary types">
          <CoinsIcon />
          <span>Salary types</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SalaryTypesDialog
        open={open}
        onOpenChange={setOpen}
        areaId={areaId}
        areaName={areaName}
      />
    </>
  );
}
