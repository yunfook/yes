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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const HOURS_PER_DAY = 8;
const DAYS_PER_MONTH = 24;
const HOURS_PER_MONTH = HOURS_PER_DAY * DAYS_PER_MONTH; // 192

export type SalaryType = "hour" | "monthly" | "other";

export type SalaryValue = {
  type: SalaryType;
  hour: number | null;
  day: number | null;
  month: number | null;
  other: string | null;
};

export type SalaryRates = {
  otRate: number;
  rdRate: number;
  phRate: number;
};

const DEFAULT_RATES: SalaryRates = { otRate: 1.5, rdRate: 2, phRate: 3 };
const EMPTY: SalaryValue = {
  type: "hour",
  hour: null,
  day: null,
  month: null,
  other: null,
};

const TYPE_LABEL: Record<SalaryType, string> = {
  hour: "Hour rate",
  monthly: "Monthly",
  other: "Other",
};

function parseNum(s: string): number | null {
  if (s.trim() === "") return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function format(n: number | null): string {
  if (n === null) return "";
  return String(n);
}

function format2dp(n: number | null): string {
  if (n === null) return "";
  return n.toFixed(2);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function SalaryDialog({
  open,
  onOpenChange,
  value,
  onSave,
  rates = DEFAULT_RATES,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  value?: SalaryValue;
  onSave: (next: SalaryValue) => void;
  rates?: SalaryRates;
}) {
  const [draft, setDraft] = React.useState<SalaryValue>(value ?? EMPTY);
  const [noOvertime, setNoOvertime] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setDraft(value ?? EMPTY);
      setNoOvertime(false);
    }
  }, [open, value]);

  const setType = (type: SalaryType) => {
    setDraft((d) => ({ ...d, type }));
  };

  const setHour = (raw: string) => {
    const hour = parseNum(raw);
    setDraft((d) => {
      if (d.type === "hour") {
        return {
          ...d,
          hour,
          day: hour === null ? null : round2(hour * HOURS_PER_DAY),
          month: hour === null ? null : round2(hour * HOURS_PER_MONTH),
        };
      }
      return { ...d, hour };
    });
  };

  const setDay = (raw: string) => {
    setDraft((d) => ({ ...d, day: parseNum(raw) }));
  };

  const setMonth = (raw: string) => {
    const month = parseNum(raw);
    setDraft((d) => {
      if (d.type === "monthly") {
        return {
          ...d,
          month,
          day: month === null ? null : round2(month / DAYS_PER_MONTH),
          hour: month === null ? null : round2(month / HOURS_PER_MONTH),
        };
      }
      return { ...d, month };
    });
  };

  const setOther = (raw: string) => {
    setDraft((d) => ({ ...d, other: raw === "" ? null : raw }));
  };

  const isOther = draft.type === "other";
  const hourEditable = draft.type === "hour";
  const monthEditable = draft.type === "monthly";

  const ot = draft.hour === null ? null : draft.hour * rates.otRate;
  const rd = draft.hour === null ? null : draft.hour * rates.rdRate;
  const ph = draft.hour === null ? null : draft.hour * rates.phRate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Salary</DialogTitle>
          <DialogDescription>
            Pick a rate type. Filling the driving field auto-computes the
            others ({HOURS_PER_DAY} hours/day, {DAYS_PER_MONTH} days/month).
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          <div className="flex gap-3">
            <div className="flex w-40 shrink-0 flex-col gap-1.5">
              <Label htmlFor="salary-type">Type</Label>
              <Select
                items={TYPE_LABEL}
                value={draft.type}
                onValueChange={(v) => setType(v as SalaryType)}
              >
                <SelectTrigger id="salary-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hour">{TYPE_LABEL.hour}</SelectItem>
                  <SelectItem value="monthly">{TYPE_LABEL.monthly}</SelectItem>
                  <SelectItem value="other">{TYPE_LABEL.other}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isOther && (
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="salary-other">Description</Label>
                <Input
                  id="salary-other"
                  type="text"
                  placeholder="e.g. commission based, project-based, etc."
                  value={draft.other ?? ""}
                  onChange={(e) => setOther(e.target.value)}
                />
              </div>
            )}
          </div>

          {!isOther && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="salary-hour">Hour</Label>
                  <Input
                    id="salary-hour"
                    type="money"
                    value={hourEditable ? format(draft.hour) : format2dp(draft.hour)}
                    onChange={(e) => setHour(e.target.value)}
                    readOnly={!hourEditable}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="salary-day">Day</Label>
                  <Input
                    id="salary-day"
                    type="money"
                    value={format2dp(draft.day)}
                    onChange={(e) => setDay(e.target.value)}
                    readOnly
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="salary-month">Month</Label>
                  <Input
                    id="salary-month"
                    type="money"
                    value={monthEditable ? format(draft.month) : format2dp(draft.month)}
                    onChange={(e) => setMonth(e.target.value)}
                    readOnly={!monthEditable}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="salary-no-ot"
                  checked={noOvertime}
                  onCheckedChange={(c) => setNoOvertime(Boolean(c))}
                  className="not-data-checked:border-foreground"
                />
                <Label htmlFor="salary-no-ot" className="cursor-pointer">
                  No Overtime
                </Label>
              </div>

              {!noOvertime && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor="salary-ot"
                      className="flex items-baseline justify-between"
                    >
                      <span className="truncate">Overtime</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        ×{rates.otRate}
                      </span>
                    </Label>
                    <Input
                      id="salary-ot"
                      type="money"
                      value={format2dp(ot)}
                      readOnly
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor="salary-rd"
                      className="flex items-baseline justify-between"
                    >
                      <span className="truncate">Restday</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        ×{rates.rdRate}
                      </span>
                    </Label>
                    <Input
                      id="salary-rd"
                      type="money"
                      value={format2dp(rd)}
                      readOnly
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor="salary-ph"
                      className="flex items-baseline justify-between"
                    >
                      <span className="truncate">Holiday</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        ×{rates.phRate}
                      </span>
                    </Label>
                    <Input
                      id="salary-ph"
                      type="money"
                      value={format2dp(ph)}
                      readOnly
                    />
                  </div>
                </div>
              )}
            </>
          )}
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
