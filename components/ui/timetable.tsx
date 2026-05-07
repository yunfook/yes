"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const DAY_LABEL: Record<DayKey, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export type DayKey = (typeof DAYS)[number];

export type TimetableSession = {
  day: DayKey;
  /** "HH:mm" */
  start: string;
  /** "HH:mm" */
  end: string;
  title: string;
  description?: string;
  className?: string;
};

export type TimetableProps = React.ComponentProps<"div"> & {
  /** "HH:mm" — first row time */
  startTime: string;
  /** "HH:mm" — last row time */
  endTime: string;
  /** Minutes per grid row (e.g. 30, 60) */
  minutesPerRow: number;
  /** Row height in pixels */
  rowHeight?: number;
  sessions?: TimetableSession[];
  /** Which day columns to render. Defaults to Mon–Sun. */
  days?: DayKey[];
  /** When true, time labels sit centered on the grid line instead of inside the row */
  timeOnLine?: boolean;
  /** When true, columns stretch to fill width (1fr) instead of fixed 8rem */
  fluid?: boolean;
};

function parseTime(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function formatTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12.toString().padStart(2, "0")}:${m
    .toString()
    .padStart(2, "0")} ${period}`;
}

function generateSlots(start: number, end: number, interval: number): number[] {
  const slots: number[] = [];
  for (let t = start; t <= end; t += interval) slots.push(t);
  return slots;
}

/** Lay out overlapping sessions within a single day-column (returns col + totalCols) */
function layoutDay(
  sessions: TimetableSession[],
): Array<TimetableSession & { col: number; totalCols: number }> {
  if (sessions.length === 0) return [];

  const sorted = [...sessions].sort(
    (a, b) => parseTime(a.start) - parseTime(b.start),
  );

  const groups: TimetableSession[][] = [];
  let current: TimetableSession[] = [sorted[0]];
  let groupEnd = parseTime(sorted[0].end);

  for (let i = 1; i < sorted.length; i++) {
    const s = sorted[i];
    if (parseTime(s.start) < groupEnd) {
      current.push(s);
      groupEnd = Math.max(groupEnd, parseTime(s.end));
    } else {
      groups.push(current);
      current = [s];
      groupEnd = parseTime(s.end);
    }
  }
  groups.push(current);

  const result: Array<
    TimetableSession & { col: number; totalCols: number }
  > = [];

  for (const group of groups) {
    const cols: number[][] = [];

    for (const session of group) {
      const sStart = parseTime(session.start);
      let placed = false;

      for (let c = 0; c < cols.length; c++) {
        const lastEnd = cols[c][cols[c].length - 1];
        if (sStart >= lastEnd) {
          cols[c].push(parseTime(session.end));
          result.push({ ...session, col: c, totalCols: 0 });
          placed = true;
          break;
        }
      }

      if (!placed) {
        cols.push([parseTime(session.end)]);
        result.push({ ...session, col: cols.length - 1, totalCols: 0 });
      }
    }

    const totalCols = cols.length;
    for (const r of result) {
      if (group.includes(r)) r.totalCols = totalCols;
    }
  }

  return result;
}

function SessionBlock({
  session,
  start,
  pxPerMinute,
}: {
  session: TimetableSession & { col: number; totalCols: number };
  start: number;
  pxPerMinute: number;
}) {
  const sStart = parseTime(session.start);
  const sEnd = parseTime(session.end);
  const top = (sStart - start) * pxPerMinute;
  const height = (sEnd - sStart) * pxPerMinute;
  const totalCols = session.totalCols;

  return (
    <div
      className={cn(
        "absolute z-10 overflow-hidden rounded-md border border-border bg-card px-2 py-1 shadow-xs transition-opacity hover:opacity-90",
        session.className,
      )}
      style={{
        top,
        height: Math.max(height - 1, 16),
        left:
          totalCols > 1
            ? `calc(${(session.col / totalCols) * 100}% + 1px)`
            : 1,
        right:
          totalCols > 1
            ? `calc(${((totalCols - session.col - 1) / totalCols) * 100}% + 1px)`
            : 1,
      }}
    >
      <span className="block truncate text-xs leading-tight font-semibold text-foreground">
        {session.title}
      </span>
      {height > 28 && session.description && (
        <p className="line-clamp-2 text-[11px] leading-tight text-muted-foreground">
          {session.description}
        </p>
      )}
    </div>
  );
}

function Timetable({
  startTime,
  endTime,
  minutesPerRow,
  rowHeight = 40,
  sessions = [],
  days = DAYS as unknown as DayKey[],
  timeOnLine = false,
  fluid = false,
  className,
  ...props
}: TimetableProps) {
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  const slots = generateSlots(start, end, minutesPerRow);
  const pxPerMinute = rowHeight / minutesPerRow;

  const laidByDay = React.useMemo(() => {
    const map = {} as Record<DayKey, TimetableSession[]>;
    for (const day of days) map[day] = [];
    for (const s of sessions) {
      if (map[s.day]) map[s.day].push(s);
    }
    const result = {} as Record<
      DayKey,
      Array<TimetableSession & { col: number; totalCols: number }>
    >;
    for (const day of days) result[day] = layoutDay(map[day]);
    return result;
  }, [sessions, days]);

  const headerHeight = 40;
  const gridHeight = slots.length * rowHeight;
  const colCount = Math.max(days.length, 1);
  const gridTemplateColumns = `4.5rem repeat(${colCount}, ${fluid ? "1fr" : "8rem"})`;

  return (
    <div
      data-slot="timetable"
      className={cn("overflow-auto rounded-lg border bg-card", className)}
      {...props}
    >
      <div
        className="relative"
        style={{
          height: gridHeight + headerHeight,
          minWidth: fluid ? undefined : `${4.5 * 16 + colCount * 8 * 16}px`,
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-30 grid border-b bg-card"
          style={{ gridTemplateColumns, height: headerHeight }}
        >
          <div className="sticky left-0 z-30 border-r border-border/40 bg-card" />
          {days.map((day, i) => (
            <div
              key={day}
              className={cn(
                "flex items-center justify-center px-2 text-sm font-medium whitespace-nowrap text-foreground",
                i < days.length - 1 && "border-r border-border/40",
              )}
            >
              {DAY_LABEL[day]}
            </div>
          ))}
        </div>

        {/* Grid rows */}
        {slots.map((slot, i) => (
          <div
            key={slot}
            className="absolute right-0 left-0 border-b border-border/40"
            style={{ top: i * rowHeight + headerHeight, height: rowHeight }}
          >
            <div
              className="grid h-full"
              style={{ gridTemplateColumns }}
            >
              <div
                className={cn(
                  "sticky left-0 z-20 flex justify-end border-r border-border/40 bg-card pr-1.5",
                  timeOnLine ? "items-start" : "items-start pt-1",
                )}
              >
                {!(timeOnLine && i === 0) && (
                  <span
                    className={cn(
                      "font-medium tabular-nums text-muted-foreground",
                      timeOnLine
                        ? "-translate-y-1/2 bg-card px-0.5 text-xs"
                        : "text-xs",
                    )}
                  >
                    {formatTime(slot)}
                  </span>
                )}
              </div>
              {days.map((day, ci) => (
                <div
                  key={day}
                  className={cn(
                    ci < days.length - 1 && "border-r border-border/40",
                  )}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Session blocks */}
        <div
          className="pointer-events-none absolute grid"
          style={{
            top: headerHeight,
            left: 0,
            right: 0,
            height: gridHeight,
            gridTemplateColumns,
          }}
        >
          <div />
          {days.map((day) => (
            <div key={day} className="pointer-events-auto relative">
              {laidByDay[day].map((session, i) => (
                <SessionBlock
                  key={`${day}-${session.start}-${session.end}-${i}`}
                  session={session}
                  start={start}
                  pxPerMinute={pxPerMinute}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { Timetable };
