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
import { PlusIcon } from "lucide-react";
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
import { Autocomplete } from "@/components/ui/autocomplete";

const HOURS_PER_DAY = 8;

export type SalaryType = "hour" | "monthly" | "other";

export type SalaryValue = {
  type: SalaryType;
  hour: number | null;
  day: number | null;
  week: number | null;
  month: number | null;
  otherTypeId: number | null;
  hasOvertime: boolean;
  hasRestday: boolean;
  hasHoliday: boolean;
};

export type SalaryRates = {
  otRate: number;
  rdRate: number;
  phRate: number;
  hoursPerWeek: number;
  daysPerMonth: number;
};

const DEFAULT_RATES: SalaryRates = {
  otRate: 1.5,
  rdRate: 2,
  phRate: 3,
  hoursPerWeek: 45,
  daysPerMonth: 24,
};
const EMPTY: SalaryValue = {
  type: "hour",
  hour: null,
  day: null,
  week: null,
  month: null,
  otherTypeId: null,
  hasOvertime: true,
  hasRestday: true,
  hasHoliday: true,
};

const TYPE_LABEL: Record<SalaryType, string> = {
  hour: "Hour rate",
  monthly: "Monthly paid",
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
  otherTypes = [],
  onAddOtherType,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  value?: SalaryValue;
  onSave: (next: SalaryValue) => void;
  rates?: SalaryRates;
  otherTypes?: { id: number; name: string }[];
  onAddOtherType?: () => void;
}) {
  const [draft, setDraft] = React.useState<SalaryValue>(value ?? EMPTY);
  const [enabledRates, setEnabledRates] = React.useState({
    overtime: true,
    restday: true,
    holiday: true,
  });

  React.useEffect(() => {
    if (open) {
      setDraft({ ...EMPTY, ...value });
      setEnabledRates({
        overtime: value?.hasOvertime ?? true,
        restday: value?.hasRestday ?? true,
        holiday: value?.hasHoliday ?? true,
      });
    }
  }, [open, value]);

  const setType = (type: SalaryType) => {
    setDraft((d) => {
      if (type === "hour") {
        return {
          ...d,
          type,
          day: d.hour === null ? null : round2(d.hour * HOURS_PER_DAY),
          week: d.hour === null ? null : round2(d.hour * rates.hoursPerWeek),
          month: null,
        };
      }
      if (type === "monthly") {
        return {
          ...d,
          type,
          day: d.month === null ? null : round2(d.month / rates.daysPerMonth),
          week: null,
          hour:
            d.month === null
              ? null
              : round2(d.month / rates.daysPerMonth / HOURS_PER_DAY),
        };
      }
      return { ...d, type };
    });
  };

  const setHour = (raw: string) => {
    const hour = parseNum(raw);
    setDraft((d) => {
      if (d.type === "hour") {
        return {
          ...d,
          hour,
          day: hour === null ? null : round2(hour * HOURS_PER_DAY),
          week: hour === null ? null : round2(hour * rates.hoursPerWeek),
          month: null,
        };
      }
      return { ...d, hour };
    });
  };

  const setMonth = (raw: string) => {
    const month = parseNum(raw);
    setDraft((d) => {
      if (d.type === "monthly") {
        return {
          ...d,
          month,
          day: month === null ? null : round2(month / rates.daysPerMonth),
          week: null,
          hour:
            month === null
              ? null
              : round2(month / rates.daysPerMonth / HOURS_PER_DAY),
        };
      }
      return { ...d, month };
    });
  };

  const setOtherTypeId = (next: number | null) => {
    setDraft((d) => ({ ...d, otherTypeId: next }));
  };

  const isOther = draft.type === "other";
  const hourEditable = draft.type === "hour";
  const monthEditable = draft.type === "monthly";

  const ot = draft.hour === null ? null : draft.hour * rates.otRate;
  const rd = draft.hour === null ? null : draft.hour * rates.rdRate;
  const ph = draft.hour === null ? null : draft.hour * rates.phRate;

  const setRateEnabled = (
    key: keyof typeof enabledRates,
    checked: boolean,
  ) => {
    setEnabledRates((current) => ({ ...current, [key]: checked }));
  };

  const buildNextDraft = (): SalaryValue => {
    if (draft.type === "other") {
      return {
        ...draft,
        hour: null,
        day: null,
        week: null,
        month: null,
        hasOvertime: false,
        hasRestday: false,
        hasHoliday: false,
      };
    }

    return {
      ...draft,
      otherTypeId: null,
      week: draft.type === "hour" ? draft.week : null,
      month: draft.type === "monthly" ? draft.month : null,
      hasOvertime: enabledRates.overtime,
      hasRestday: enabledRates.restday,
      hasHoliday: enabledRates.holiday,
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Salary</DialogTitle>
          <DialogDescription>
            Pick a rate type. Filling the driving field auto-computes the
            others.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          <div className="flex w-40 shrink-0 flex-col gap-1.5">
            <Label htmlFor="salary-type">Salary Type</Label>
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
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <Label htmlFor="salary-other">Type</Label>
                {onAddOtherType && (
                  <Button type="button" size="xs" onClick={onAddOtherType}>
                    <PlusIcon /> Add
                  </Button>
                )}
              </div>
              <Autocomplete<number>
                  id="salary-other"
                  items={otherTypes.map((t) => ({
                    value: t.id,
                    label: t.name,
                  }))}
                  value={draft.otherTypeId}
                  onValueChange={(v) => setOtherTypeId(v)}
                  placeholder={
                    otherTypes.length === 0
                      ? "No salary types yet"
                      : "Select salary type"
                  }
                  emptyMessage="No matching types."
                  disabled={otherTypes.length === 0}
                />
              </div>
            )}

          {!isOther && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="salary-hour"
                    className="flex items-baseline justify-between gap-2"
                  >
                    <span>Hour</span>
                    {draft.type === "monthly" && (
                      <span className="text-xs font-normal text-muted-foreground">
                        d/{HOURS_PER_DAY}
                      </span>
                    )}
                  </Label>
                  <Input
                    id="salary-hour"
                    type="money"
                    value={
                      hourEditable ? format(draft.hour) : format2dp(draft.hour)
                    }
                    onChange={(e) => setHour(e.target.value)}
                    readOnly={!hourEditable}
                    clearable
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="salary-day"
                    className="flex items-baseline justify-between gap-2"
                  >
                    <span>Day</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {draft.type === "hour"
                        ? `hx${HOURS_PER_DAY}`
                        : `m/${rates.daysPerMonth}`}
                    </span>
                  </Label>
                  <Input
                    id="salary-day"
                    type="money"
                    value={format2dp(draft.day)}
                    readOnly
                    clearable
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  {draft.type === "hour" ? (
                    <>
                      <Label
                        htmlFor="salary-week"
                        className="flex items-baseline justify-between gap-2"
                      >
                        <span>Week</span>
                        <span className="text-xs font-normal text-muted-foreground">
                          hx{rates.hoursPerWeek}
                        </span>
                      </Label>
                      <Input
                        id="salary-week"
                        type="money"
                        value={format2dp(draft.week)}
                        readOnly
                        clearable
                      />
                    </>
                  ) : (
                    <>
                      <Label htmlFor="salary-month">Monthly</Label>
                      <Input
                        id="salary-month"
                        type="money"
                        value={
                          monthEditable
                            ? format(draft.month)
                            : format2dp(draft.month)
                        }
                        onChange={(e) => setMonth(e.target.value)}
                        readOnly={!monthEditable}
                        clearable
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="salary-ot"
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      <Checkbox
                        id="salary-ot-enabled"
                        checked={enabledRates.overtime}
                        onCheckedChange={(c) =>
                          setRateEnabled("overtime", c === true)
                        }
                      />
                      <span className="truncate">Overtime</span>
                    </span>
                    <span className="text-xs font-normal text-muted-foreground">
                      hx{rates.otRate}
                    </span>
                  </Label>
                  <Input
                    id="salary-ot"
                    type="money"
                    value={enabledRates.overtime ? format2dp(ot) : ""}
                    readOnly
                    disabled={!enabledRates.overtime}
                    clearable
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="salary-rd"
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      <Checkbox
                        id="salary-rd-enabled"
                        checked={enabledRates.restday}
                        onCheckedChange={(c) =>
                          setRateEnabled("restday", c === true)
                        }
                      />
                      <span className="truncate">Restday</span>
                    </span>
                    <span className="text-xs font-normal text-muted-foreground">
                      hx{rates.rdRate}
                    </span>
                  </Label>
                  <Input
                    id="salary-rd"
                    type="money"
                    value={enabledRates.restday ? format2dp(rd) : ""}
                    readOnly
                    disabled={!enabledRates.restday}
                    clearable
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="salary-ph"
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      <Checkbox
                        id="salary-ph-enabled"
                        checked={enabledRates.holiday}
                        onCheckedChange={(c) =>
                          setRateEnabled("holiday", c === true)
                        }
                      />
                      <span className="truncate">Holiday</span>
                    </span>
                    <span className="text-xs font-normal text-muted-foreground">
                      hx{rates.phRate}
                    </span>
                  </Label>
                  <Input
                    id="salary-ph"
                    type="money"
                    value={enabledRates.holiday ? format2dp(ph) : ""}
                    readOnly
                    disabled={!enabledRates.holiday}
                    clearable
                  />
                </div>
              </div>
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
              onSave(buildNextDraft());
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
