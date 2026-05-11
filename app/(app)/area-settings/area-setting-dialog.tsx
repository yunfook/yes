"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AreaSettingForm } from "./area-setting-form";
import { getAreaSetting } from "./actions";

export function AreaSettingDialog({
  open,
  onOpenChange,
  areaId,
  areaName,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  areaId: number;
  areaName?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Area Settings{areaName ? ` - ${areaName}` : ""}
          </DialogTitle>
          <DialogDescription>
            Defaults applied across this area — pay multipliers and working
            hours.
          </DialogDescription>
        </DialogHeader>
        {open ? <AreaSettingBody areaId={areaId} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function AreaSettingBody({ areaId }: { areaId: number }) {
  const { data } = useQuery({
    queryKey: ["areaSetting", areaId],
    queryFn: () => getAreaSetting(areaId),
  });

  if (!data) {
    return <div className="py-6 text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="max-h-[60vh] overflow-y-auto rounded-md border">
      <AreaSettingForm areaId={areaId} initial={data} />
    </div>
  );
}
