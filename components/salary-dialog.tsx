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
};

export type SalaryRates = {
  otRate: number;
  rdRate: number;
  phRate: number;
};

const DEFAULT_RATES: SalaryRates = { otRate: 1.5, rdRate: 2, phRate: 3 };
const EMPTY: SalaryValue = { type: "hour", hour: null, day: null, month: null };

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
  return Number.isInteger(n) ? String(n) : String(n);
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

  React.useEffect(() => {
    if (open) setDraft(value ?? EMPTY);
  }, [open, value]);

  const setType = (type: SalaryType) => {
    setDraft((d) => ({ ...d, type }));
  };

  const setHour = (raw: string) => {
    const hour = parseNum(raw);
    setDraft((d) => {
      if (d.type === "hour") {
        return {
          type: d.type,
          hour,
          day: hour === null ? null : hour * HOURS_PER_DAY,
          month: hour === null ? null : hour * HOURS_PER_MONTH,
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
          type: d.type,
          month,
          day: month === null ? null : month / DAYS_PER_MONTH,
          hour: month === null ? null : month / HOURS_PER_MONTH,
        };
      }
      return { ...d, month };
    });
  };

  const hourEditable = draft.type === "hour" || draft.type === "other";
  const dayEditable = draft.type === "other";
  const monthEditable = draft.type === "monthly" || draft.type === "other";

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
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="salary-type">Type</Label>
            <Select
              items={TYPE_LABEL}
              value={draft.type}
              onValueChange={(v) => setType(v as SalaryType)}
            >
              <SelectTrigger id="salary-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hour">{TYPE_LABEL.hour}</SelectItem>
                <SelectItem value="monthly">{TYPE_LABEL.monthly}</SelectItem>
                <SelectItem value="other">{TYPE_LABEL.other}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="salary-hour">Hour</Label>
              <Input
                id="salary-hour"
                type="money"
                value={format(draft.hour)}
                onChange={(e) => setHour(e.target.value)}
                readOnly={!hourEditable}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="salary-day">Day</Label>
              <Input
                id="salary-day"
                type="money"
                value={format(draft.day)}
                onChange={(e) => setDay(e.target.value)}
                readOnly={!dayEditable}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="salary-month">Month</Label>
              <Input
                id="salary-month"
                type="money"
                value={format(draft.month)}
                onChange={(e) => setMonth(e.target.value)}
                readOnly={!monthEditable}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="salary-ot">
                Overtime/h ×{rates.otRate}
              </Label>
              <Input id="salary-ot" type="money" value={format(ot)} readOnly />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="salary-rd">
                Restday/h ×{rates.rdRate}
              </Label>
              <Input id="salary-rd" type="money" value={format(rd)} readOnly />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="salary-ph">
                Holiday/h ×{rates.phRate}
              </Label>
              <Input id="salary-ph" type="money" value={format(ph)} readOnly />
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
