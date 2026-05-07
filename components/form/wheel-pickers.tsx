"use client";

import * as React from "react";
import { ClockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  WheelPicker,
  WheelPickerWrapper,
} from "@/components/wheel-picker";
import { cn } from "@/lib/utils";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function parseHM(hm: string): { h24: number; m: number } {
  const [h, m] = hm.split(":").map(Number);
  return { h24: h ?? 0, m: m ?? 0 };
}

function to12(h24: number): { hour: number; period: "AM" | "PM" } {
  const period: "AM" | "PM" = h24 >= 12 ? "PM" : "AM";
  const hour = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
  return { hour, period };
}

function from12(hour: number, period: "AM" | "PM"): number {
  if (period === "AM") return hour === 12 ? 0 : hour;
  return hour === 12 ? 12 : hour + 12;
}

function formatHourLabel(hm: string): string {
  const { h24 } = parseHM(hm);
  const { hour, period } = to12(h24);
  return `${hour}:00 ${period}`;
}

function formatTimeLabel(hm: string): string {
  const { h24, m } = parseHM(hm);
  const { hour, period } = to12(h24);
  return `${hour}:${pad(m)} ${period}`;
}

function formatHourShort(hm: string): string {
  const { h24 } = parseHM(hm);
  const { hour, period } = to12(h24);
  return `${hour}${period}`;
}

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: String(i + 1),
}));

const PERIOD_OPTIONS = [
  { value: "AM" as const, label: "AM" },
  { value: "PM" as const, label: "PM" },
];

const HOUR24_OPTIONS = Array.from({ length: 24 }, (_, h24) => {
  const { hour, period } = to12(h24);
  return { value: h24, label: `${hour} ${period}` };
});

const WHEEL_COMMON = { visibleCount: 11, optionItemHeight: 24 } as const;

function triggerClass(display: string | null, className?: string) {
  return cn(
    "justify-start font-normal",
    !display && "text-muted-foreground",
    className,
  );
}

// ---------------------------------------------------------------------------
// HourPicker — popover with hour + AM/PM
// ---------------------------------------------------------------------------

export function HourPicker({
  value,
  onChange,
  disabled,
  id,
  placeholder = "Pick hour",
  className,
}: {
  value: string; // "HH:00"
  onChange: (next: string) => void;
  disabled?: boolean;
  id?: string;
  placeholder?: string;
  className?: string;
}) {
  const { h24 } = parseHM(value);
  const { hour, period } = to12(h24);

  const setHour = (h: number) =>
    onChange(`${pad(from12(h, period))}:00`);
  const setPeriod = (p: "AM" | "PM") =>
    onChange(`${pad(from12(hour, p))}:00`);

  const display = value ? formatHourLabel(value) : null;
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={triggerClass(display, className)}
          />
        }
      >
        <ClockIcon className="size-4" />
        {display ?? placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-44" align="start">
        <WheelPickerWrapper className="w-full rounded-none bg-transparent px-0 dark:bg-transparent">
          <WheelPicker<number>
            {...WHEEL_COMMON}
            value={hour}
            onValueChange={setHour}
            options={HOUR_OPTIONS}
            infinite
          />
          <WheelPicker<"AM" | "PM">
            {...WHEEL_COMMON}
            value={period}
            onValueChange={setPeriod}
            options={PERIOD_OPTIONS}
          />
        </WheelPickerWrapper>
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// TimePicker — popover with hour + minute + AM/PM
// ---------------------------------------------------------------------------

export function TimePicker({
  value,
  onChange,
  disabled,
  id,
  placeholder = "Pick time",
  minuteStep = 5,
  className,
}: {
  value: string; // "HH:mm"
  onChange: (next: string) => void;
  disabled?: boolean;
  id?: string;
  placeholder?: string;
  minuteStep?: 1 | 5 | 10 | 15 | 30;
  className?: string;
}) {
  const { h24, m } = parseHM(value);
  const { hour, period } = to12(h24);

  const minuteOptions = React.useMemo(() => {
    const count = Math.floor(60 / minuteStep);
    return Array.from({ length: count }, (_, i) => ({
      value: i * minuteStep,
      label: pad(i * minuteStep),
    }));
  }, [minuteStep]);

  const snappedMinute = m - (m % minuteStep);

  const setHour = (h: number) =>
    onChange(`${pad(from12(h, period))}:${pad(m)}`);
  const setMinute = (mm: number) => onChange(`${pad(h24)}:${pad(mm)}`);
  const setPeriod = (p: "AM" | "PM") =>
    onChange(`${pad(from12(hour, p))}:${pad(m)}`);

  const display = value ? formatTimeLabel(value) : null;
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={triggerClass(display, className)}
          />
        }
      >
        <ClockIcon className="size-4" />
        {display ?? placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-56" align="start">
        <WheelPickerWrapper className="w-full rounded-none bg-transparent px-0 dark:bg-transparent">
          <WheelPicker<number>
            {...WHEEL_COMMON}
            value={hour}
            onValueChange={setHour}
            options={HOUR_OPTIONS}
            infinite
          />
          <WheelPicker<number>
            {...WHEEL_COMMON}
            value={snappedMinute}
            onValueChange={setMinute}
            options={minuteOptions}
            infinite
          />
          <WheelPicker<"AM" | "PM">
            {...WHEEL_COMMON}
            value={period}
            onValueChange={setPeriod}
            options={PERIOD_OPTIONS}
          />
        </WheelPickerWrapper>
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// SessionPicker — popover with start hour + end hour, 12 AM to 11 PM
// ---------------------------------------------------------------------------

export function SessionPicker({
  value,
  onChange,
  disabled,
  id,
  placeholder = "Pick session",
  className,
}: {
  value: { start: string; end: string };
  onChange: (next: { start: string; end: string }) => void;
  disabled?: boolean;
  id?: string;
  placeholder?: string;
  className?: string;
}) {
  const { h24: startH } = parseHM(value.start);
  const { h24: endH } = parseHM(value.end);

  const setStart = (h: number) =>
    onChange({ ...value, start: `${pad(h)}:00` });
  const setEnd = (h: number) =>
    onChange({ ...value, end: `${pad(h)}:00` });

  const display =
    value.start && value.end
      ? `${formatHourShort(value.start)} – ${formatHourShort(value.end)}`
      : null;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={triggerClass(display, className)}
          />
        }
      >
        <ClockIcon className="size-4" />
        {display ?? placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-56" align="start">
        <div className="grid grid-cols-2 pb-2 text-center text-xs font-medium text-muted-foreground">
          <span>Start</span>
          <span>End</span>
        </div>
        <WheelPickerWrapper className="w-full rounded-none bg-transparent px-0 dark:bg-transparent">
          <WheelPicker<number>
            {...WHEEL_COMMON}
            value={startH}
            onValueChange={setStart}
            options={HOUR24_OPTIONS}
          />
          <WheelPicker<number>
            {...WHEEL_COMMON}
            value={endH}
            onValueChange={setEnd}
            options={HOUR24_OPTIONS}
          />
        </WheelPickerWrapper>
      </PopoverContent>
    </Popover>
  );
}
