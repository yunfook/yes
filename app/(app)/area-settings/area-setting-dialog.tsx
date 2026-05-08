"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AreaSettingForm } from "./area-setting-form";
import { getAreaSetting, type AreaSettingValues } from "./actions";

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
  const [data, setData] = React.useState<{
    areaId: number;
    values: AreaSettingValues;
  } | null>(null);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getAreaSetting(areaId).then((v) => {
      if (!cancelled) setData({ areaId, values: v });
    });
    return () => {
      cancelled = true;
    };
  }, [open, areaId]);

  const initial =
    data && data.areaId === areaId ? data.values : null;

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
        {initial ? (
          <div className="max-h-[60vh] overflow-y-auto rounded-md border">
            <AreaSettingForm areaId={areaId} initial={initial} />
          </div>
        ) : (
          <div className="py-6 text-sm text-muted-foreground">Loading…</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
