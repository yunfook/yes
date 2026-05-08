"use client";

import * as React from "react";
import { CalendarDaysIcon, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkingScheduleDialog } from "@/components/working-schedule-dialog";
import { useEmployeeDraftStore } from "./employee-draft-store";

export function WorkingScheduleDialogButton({
  defaults,
}: {
  defaults: { workStart: string; workEnd: string };
}) {
  const [open, setOpen] = React.useState(false);
  const schedule = useEmployeeDraftStore((s) => s.schedule);
  const setSchedule = useEmployeeDraftStore((s) => s.setSchedule);

  const filled = !!schedule?.restday && schedule.restday.length > 0;

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <CalendarDaysIcon />
        Set schedule
        {filled && <CheckIcon className="ml-1 size-3.5" />}
      </Button>
      <WorkingScheduleDialog
        open={open}
        onOpenChange={setOpen}
        value={schedule ?? undefined}
        onSave={setSchedule}
        defaults={defaults}
      />
    </>
  );
}
