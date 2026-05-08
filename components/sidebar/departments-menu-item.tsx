"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Building2Icon } from "lucide-react";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { DepartmentsDialog } from "@/app/(app)/departments/departments-dialog";

export function DepartmentsMenuItem({
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
        <SidebarMenuButton onClick={() => setOpen(true)} tooltip="Departments">
          <Building2Icon />
          <span>Departments</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <DepartmentsDialog
        open={open}
        onOpenChange={setOpen}
        areaId={areaId}
        areaName={areaName}
      />
    </>
  );
}
