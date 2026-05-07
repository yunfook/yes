"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { HourPicker } from "@/components/form/wheel-pickers";
import {
  Timetable,
  type DayKey,
  type TimetableSession,
} from "@/components/ui/timetable";

export const RESTDAY_VALUES = [
  "none",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
export type RestdayValue = (typeof RESTDAY_VALUES)[number];

export type WorkingScheduleValue = {
  restday: RestdayValue[] | null;
};

const EMPTY: WorkingScheduleValue = { restday: null };

const ALL_DAYS: DayKey[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const DAY_LABEL: Record<DayKey, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

type BreakType = "30m" | "1h" | "2h" | "none";

type DaySchedule = {
  workStart: string;
  workEnd: string;
  breakStart: string;
  breakEnabled: boolean;
};

const DEFAULT_DAY: DaySchedule = {
  workStart: "07:00",
  workEnd: "16:00",
  breakStart: "12:00",
  breakEnabled: true,
};

function parseHM(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function addMinutes(time: string, minutes: number): string {
  const total = parseHM(time) + minutes;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${pad(h)}:${pad(m)}`;
}

function breakMinutes(breakType: BreakType): number {
  if (breakType === "30m") return 30;
  if (breakType === "2h") return 120;
  return 60;
}

function endMinutes(time: string): number {
  const v = parseHM(time);
  return v === 0 ? 24 * 60 : v;
}

function endLabel(time: string): string {
  return time === "00:00" ? "24:00" : time;
}

function isDayValid(s: DaySchedule): boolean {
  return endMinutes(s.workEnd) > parseHM(s.workStart);
}

function dayToSessions(
  day: DayKey,
  s: DaySchedule,
  breakType: BreakType,
): TimetableSession[] {
  const ws = parseHM(s.workStart);
  const we = endMinutes(s.workEnd);
  if (we <= ws) return [];
  const weLabel = endLabel(s.workEnd);
  if (breakType === "none" || !s.breakEnabled) {
    return [{ day, start: s.workStart, end: weLabel, title: "Work" }];
  }
  const bs = parseHM(s.breakStart);
  const breakEnd = addMinutes(s.breakStart, breakMinutes(breakType));
  const be = parseHM(breakEnd);
  if (be <= bs || bs < ws || be > we) {
    return [{ day, start: s.workStart, end: weLabel, title: "Work" }];
  }
  return [
    { day, start: s.workStart, end: s.breakStart, title: "Work" },
    {
      day,
      start: s.breakStart,
      end: breakEnd,
      title: "Break",
      className:
        "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-800",
    },
    { day, start: breakEnd, end: weLabel, title: "Work" },
  ];
}

export function WorkingScheduleDialog({
  open,
  onOpenChange,
  value,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  value?: WorkingScheduleValue;
  onSave: (next: WorkingScheduleValue) => void;
}) {
  const [draft, setDraft] = React.useState<WorkingScheduleValue>(
    value ?? EMPTY,
  );
  const [breakType, setBreakType] = React.useState<BreakType>("1h");
  const [schedules, setSchedules] = React.useState<
    Record<DayKey, DaySchedule>
  >(() => Object.fromEntries(ALL_DAYS.map((d) => [d, { ...DEFAULT_DAY }])) as Record<DayKey, DaySchedule>);

  React.useEffect(() => {
    if (open) {
      setDraft(value ?? EMPTY);
      setBreakType("1h");
      setSchedules(
        Object.fromEntries(
          ALL_DAYS.map((d) => [d, { ...DEFAULT_DAY }]),
        ) as Record<DayKey, DaySchedule>,
      );
    }
  }, [open, value]);

  const selectedRest = draft.restday ?? [];
  const hasNone = selectedRest.includes("none");
  const items: { value: RestdayValue; label: string; disabled?: boolean }[] = [
    { value: "none", label: "No Restday" },
    { value: "monday", label: "Monday", disabled: hasNone },
    { value: "tuesday", label: "Tuesday", disabled: hasNone },
    { value: "wednesday", label: "Wednesday", disabled: hasNone },
    { value: "thursday", label: "Thursday", disabled: hasNone },
    { value: "friday", label: "Friday", disabled: hasNone },
    { value: "saturday", label: "Saturday", disabled: hasNone },
    { value: "sunday", label: "Sunday", disabled: hasNone },
  ];

  const setRestday = (next: RestdayValue[]) => {
    const justAddedNone =
      next.includes("none") && !selectedRest.includes("none");
    const final = justAddedNone ? (["none"] as RestdayValue[]) : next;
    setDraft((d) => ({ ...d, restday: final.length === 0 ? null : final }));
  };

  const restSet = new Set<RestdayValue>(selectedRest);
  const visibleDays: DayKey[] = ALL_DAYS.filter((d) => !restSet.has(d));
  const hasBreak = breakType !== "none";

  const sessions: TimetableSession[] = visibleDays.flatMap((day) =>
    dayToSessions(day, schedules[day], breakType),
  );

  const hasInvalidDay = visibleDays.some((d) => !isDayValid(schedules[d]));

  const updateDay = (day: DayKey, patch: Partial<DaySchedule>) => {
    setSchedules((s) => ({ ...s, [day]: { ...s[day], ...patch } }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-7xl">
        <DialogHeader>
          <DialogTitle>Working Schedule</DialogTitle>
          <DialogDescription>
            Pick rest days, break type, and per-day working hours.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 py-1 md:grid-cols-[1fr_28rem]">
          <Timetable
            startTime="00:00"
            endTime="23:00"
            minutesPerRow={60}
            rowHeight={26}
            fluid
            timeOnLine
            days={visibleDays}
            sessions={sessions}
            className="max-h-[34rem] overflow-auto"
          />

          <div className="flex max-h-[34rem] flex-col gap-4 overflow-auto pr-1">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ws-restday">Restday</Label>
              <MultiSelect<RestdayValue>
                id="ws-restday"
                items={items}
                value={selectedRest}
                onValueChange={setRestday}
                placeholder="Pick rest days"
                emptyMessage="No matching options."
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Break Type</Label>
              <RadioGroup
                value={breakType}
                onValueChange={(v) => setBreakType(v as BreakType)}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="30m" id="bt-30m" />
                  <Label htmlFor="bt-30m" className="cursor-pointer">
                    30 mins
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="1h" id="bt-1h" />
                  <Label htmlFor="bt-1h" className="cursor-pointer">
                    1 hour
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="2h" id="bt-2h" />
                  <Label htmlFor="bt-2h" className="cursor-pointer">
                    2 hour
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="none" id="bt-none" />
                  <Label htmlFor="bt-none" className="cursor-pointer">
                    No break
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex flex-col gap-3">
              {visibleDays.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No working days configured.
                </p>
              )}
              {visibleDays.map((day) => {
                const s = schedules[day];
                const valid = isDayValid(s);
                return (
                  <div
                    key={day}
                    className="flex flex-col  rounded-md "
                  >
                    <Label className="text-sm">{DAY_LABEL[day]}</Label>

                    <div className="flex flex-wrap items-end gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">
                          Working Hour
                        </span>
                        <div className="flex items-center gap-2">
                          <HourPicker
                            value={s.workStart}
                            onChange={(v) => updateDay(day, { workStart: v })}
                          />
                          <span className="text-xs text-muted-foreground">–</span>
                          <HourPicker
                            value={s.workEnd}
                            onChange={(v) => updateDay(day, { workEnd: v })}
                          />
                        </div>
                      </div>
                      {hasBreak && (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <Checkbox
                              id={`break-${day}`}
                              checked={s.breakEnabled}
                              onCheckedChange={(c) =>
                                updateDay(day, { breakEnabled: c === true })
                              }
                            />
                            <Label
                              htmlFor={`break-${day}`}
                              className="cursor-pointer text-xs text-muted-foreground"
                            >
                              Break
                            </Label>
                          </div>
                          <HourPicker
                            value={s.breakStart}
                            onChange={(v) => updateDay(day, { breakStart: v })}
                            disabled={!s.breakEnabled}
                          />
                        </div>
                      )}
                    </div>
                    {!valid && (
                      <p className="mt-1 text-xs text-destructive">
                        End time must be later than start time.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={hasInvalidDay}
            onClick={() => {
              onSave(draft);
              onOpenChange(false);
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
