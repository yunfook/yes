"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { WheelPicker, WheelPickerWrapper } from "@/components/wheel-picker";
import { cn } from "@/lib/utils";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const YEAR_FROM = 1950;
const YEAR_TO = 2030;

const yearOptions = Array.from(
  { length: YEAR_TO - YEAR_FROM + 1 },
  (_, i) => {
    const y = YEAR_FROM + i;
    return { value: y, label: String(y) };
  },
);

const monthOptions = MONTHS.map((m, i) => ({ value: i + 1, label: m }));

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function parse(value: string | null | undefined) {
  if (value && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return { year: y, month: m, day: d };
  }
  const today = new Date();
  return {
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    day: today.getDate(),
  };
}

function formatDisplay(value: string | null | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}/.test(value)) return null;
  const { year, month, day } = parse(value);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

export function DatePicker({
  value,
  onChange,
  disabled,
  id,
  placeholder = "Pick a date",
}: {
  value: string | null | undefined;
  onChange: (next: string) => void;
  disabled?: boolean;
  id?: string;
  placeholder?: string;
}) {
  const display = formatDisplay(value);
  const { year, month, day } = parse(value);

  const dayOptions = React.useMemo(() => {
    const max = daysInMonth(year, month);
    return Array.from({ length: max }, (_, i) => ({
      value: i + 1,
      label: pad(i + 1),
    }));
  }, [year, month]);

  const emit = (y: number, m: number, d: number) => {
    const safeDay = Math.min(d, daysInMonth(y, m));
    onChange(`${y}-${pad(m)}-${pad(safeDay)}`);
  };

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start font-normal",
              !display && "text-muted-foreground",
            )}
          />
        }
      >
        <CalendarIcon className="size-4" />
        {display ?? placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <WheelPickerWrapper className="w-full rounded-none bg-transparent px-0 dark:bg-transparent [&>[data-rwp]:nth-child(2)]:flex-[2]">
          <WheelPicker<number>
            value={day}
            onValueChange={(d) => emit(year, month, d)}
            options={dayOptions}
          />
          <WheelPicker<number>
            value={month}
            onValueChange={(m) => emit(year, m, day)}
            options={monthOptions}
          />
          <WheelPicker<number>
            value={year}
            onValueChange={(y) => emit(y, month, day)}
            options={yearOptions}
          />
        </WheelPickerWrapper>
      </PopoverContent>
    </Popover>
  );
}
