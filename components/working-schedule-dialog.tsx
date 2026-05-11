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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BreakPicker, HourPicker } from "@/components/form/wheel-pickers";
import {
  BREAK_SESSION_CLASS,
  RESTDAY_COLUMN_CLASS,
  Timetable,
  WORK_SESSION_CLASS,
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

export type BreakType = "30m" | "1h" | "2h" | "none";

export type DaySchedule = {
  workStart: string;
  workEnd: string;
  breakStart: string;
  breakEnabled: boolean;
};

export type WorkingScheduleValue = {
  restday: RestdayValue[];
  breakType: BreakType;
  days: Record<DayKey, DaySchedule>;
};

const ALL_DAYS: DayKey[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

function buildDefaultDays(
  wStart: string,
  wEnd: string,
): Record<DayKey, DaySchedule> {
  return Object.fromEntries(
    ALL_DAYS.map((d) => [d, buildDay(wStart, wEnd)]),
  ) as Record<DayKey, DaySchedule>;
}

const DAY_LABEL: Record<DayKey, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

function buildDay(workStart: string, workEnd: string): DaySchedule {
  return {
    workStart,
    workEnd,
    breakStart: "12:00",
    breakEnabled: true,
  };
}

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

function workingHours(s: DaySchedule, breakType: BreakType): number {
  const total = endMinutes(s.workEnd) - parseHM(s.workStart);
  const brk =
    breakType !== "none" && s.breakEnabled ? breakMinutes(breakType) : 0;
  return Math.max(0, total - brk) / 60;
}

function fmtHours(h: number): string {
  if (Number.isInteger(h)) return String(h);
  return h.toFixed(2).replace(/\.?0+$/, "");
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
    return [
      { day, start: s.workStart, end: weLabel, title: "Work", className: WORK_SESSION_CLASS },
    ];
  }
  const bs = parseHM(s.breakStart);
  const breakEnd = addMinutes(s.breakStart, breakMinutes(breakType));
  const be = parseHM(breakEnd);
  if (be <= bs || bs < ws || be > we) {
    return [
      { day, start: s.workStart, end: weLabel, title: "Work", className: WORK_SESSION_CLASS },
    ];
  }
  return [
    { day, start: s.workStart, end: s.breakStart, title: "Work", className: WORK_SESSION_CLASS },
    { day, start: s.breakStart, end: breakEnd, title: "Break", className: BREAK_SESSION_CLASS },
    { day, start: breakEnd, end: weLabel, title: "Work", className: WORK_SESSION_CLASS },
  ];
}

export function WorkingScheduleDialog({
  open,
  onOpenChange,
  value,
  onSave,
  defaults,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  value?: WorkingScheduleValue;
  onSave: (next: WorkingScheduleValue) => void;
  defaults?: { workStart: string; workEnd: string };
}) {
  const wStart = defaults?.workStart ?? "07:00";
  const wEnd = defaults?.workEnd ?? "16:00";

  const [restday, setRestdayState] = React.useState<RestdayValue[]>(
    value?.restday ?? ["none"],
  );
  const [breakType, setBreakType] = React.useState<BreakType>(
    value?.breakType ?? "1h",
  );
  const [schedules, setSchedules] = React.useState<
    Record<DayKey, DaySchedule>
  >(() => value?.days ?? buildDefaultDays(wStart, wEnd));

  React.useEffect(() => {
    if (open) {
      setRestdayState(value?.restday ?? ["none"]);
      setBreakType(value?.breakType ?? "1h");
      setSchedules(value?.days ?? buildDefaultDays(wStart, wEnd));
    }
  }, [open, value, wStart, wEnd]);

  const selectedRest = restday;
  const items: { value: RestdayValue; label: string; disabled?: boolean }[] = [
    { value: "none", label: "No Restday" },
    { value: "monday", label: "Monday" },
    { value: "tuesday", label: "Tuesday" },
    { value: "wednesday", label: "Wednesday" },
    { value: "thursday", label: "Thursday" },
    { value: "friday", label: "Friday" },
    { value: "saturday", label: "Saturday" },
    { value: "sunday", label: "Sunday" },
  ];

  const setRestday = (next: RestdayValue[]) => {
    const wasNone = selectedRest.includes("none");
    const hasNoneNow = next.includes("none");
    const justAddedNone = hasNoneNow && !wasNone;
    if (justAddedNone) {
      // Clicking "No Restday" clears all other selections.
      setRestdayState(["none"]);
      return;
    }
    if (hasNoneNow && next.length > 1) {
      // Picked another day while "No Restday" was selected — drop "none".
      setRestdayState(next.filter((v) => v !== "none"));
      return;
    }
    setRestdayState(next);
  };

  const restSet = new Set<RestdayValue>(selectedRest);
  const visibleDays: DayKey[] = ALL_DAYS.filter((d) => !restSet.has(d));
  const hasBreak = breakType !== "none";

  const sessions: TimetableSession[] = visibleDays.flatMap((day) =>
    dayToSessions(day, schedules[day], breakType),
  );

  const dayClassName: Partial<Record<DayKey, string>> = Object.fromEntries(
    ALL_DAYS.filter((d) => restSet.has(d)).map((d) => [d, RESTDAY_COLUMN_CLASS]),
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
            days={ALL_DAYS}
            dayClassName={dayClassName}
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
                          <BreakPicker
                            value={s.breakStart}
                            onChange={(v) => updateDay(day, { breakStart: v })}
                            workStart={s.workStart}
                            workEnd={s.workEnd}
                            breakType={breakType as Exclude<BreakType, "none">}
                            disabled={!s.breakEnabled || !valid}
                          />
                        </div>
                      )}
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">
                          Total
                        </span>
                        <Input
                          value={
                            valid
                              ? `${fmtHours(workingHours(s, breakType))}h`
                              : "—"
                          }
                          readOnly
                          className="w-20 text-center"
                        />
                      </div>
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
              const finalRestday: RestdayValue[] =
                restday.length === 0 ? ["none"] : restday;
              onSave({
                restday: finalRestday,
                breakType,
                days: schedules,
              });
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
