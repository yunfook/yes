"use client";

import * as React from "react";
import { CalendarDaysIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkingScheduleDialog } from "@/components/working-schedule-dialog";
import { useWorkingScheduleStore } from "./working-schedule-store";

const DAY_LABEL: Record<string, string> = {
  none: "No Restday",
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

export function WorkingScheduleDialogButton() {
  const [open, setOpen] = React.useState(false);
  const schedule = useWorkingScheduleStore((s) => s.schedule);
  const setSchedule = useWorkingScheduleStore((s) => s.setSchedule);

  const restday = schedule?.restday ?? null;
  const summary =
    !restday || restday.length === 0
      ? "Set schedule"
      : restday.includes("none")
        ? "No Restday"
        : `Off: ${restday.map((d) => DAY_LABEL[d] ?? d).join(", ")}`;

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <CalendarDaysIcon />
        {summary}
      </Button>
      <WorkingScheduleDialog
        open={open}
        onOpenChange={setOpen}
        value={schedule ?? undefined}
        onSave={setSchedule}
      />
    </>
  );
}
