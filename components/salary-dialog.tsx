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
import { Input, SmallInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const HOURS_PER_DAY = 8;

export type SalaryType = "hour" | "monthly" | "other";

export type SalaryValue = {
  type: SalaryType;
  hour: number | null;
  month: number | null;
  otherTypeId: number | null;
  hasOvertime: boolean | null;
  hasRestday: boolean | null;
  hasHoliday: boolean | null;
  hasDouble: boolean | null;
  hasTriple: boolean | null;
  hoursPerDay: number | null;
  daysPerMonth: number | null;
};

export type SalaryRates = {
  hasOt: boolean;
  hasRd: boolean;
  hasPh: boolean;
  hasDbl: boolean;
  hasTpl: boolean;
  otRate: number;
  rdRate: number;
  phRate: number;
  hoursPerWeek: number;
  daysPerMonth: number;
};

const DEFAULT_RATES: SalaryRates = {
  hasOt: true,
  hasRd: true,
  hasPh: true,
  hasDbl: false,
  hasTpl: false,
  otRate: 1.5,
  rdRate: 2,
  phRate: 3,
  hoursPerWeek: 45,
  daysPerMonth: 24,
};

const EMPTY: SalaryValue = {
  type: "hour",
  hour: null,
  month: null,
  otherTypeId: null,
  hasOvertime: null,
  hasRestday: null,
  hasHoliday: null,
  hasDouble: null,
  hasTriple: null,
  hoursPerDay: null,
  daysPerMonth: null,
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

function InlineNumInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const [text, setText] = React.useState<string>(String(value));
  return (
    <SmallInput
      type="number"
      min={1}
      step="0.01"
      value={text}
      onChange={(e) => {
        const next = e.target.value;
        setText(next);
        const n = Number(next);
        if (Number.isFinite(n) && n > 0) onChange(n);
      }}
    />
  );
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Salary</DialogTitle>
          <DialogDescription>
            Pick a rate type. Filling the driving field auto-computes the
            others.
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <SalaryDialogBody
            initialValue={value}
            rates={rates}
            otherTypes={otherTypes}
            onAddOtherType={onAddOtherType}
            onSave={(next) => {
              onSave(next);
              onOpenChange(false);
            }}
            onCancel={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function SalaryDialogBody({
  initialValue,
  rates,
  otherTypes,
  onAddOtherType,
  onSave,
  onCancel,
}: {
  initialValue?: SalaryValue;
  rates: SalaryRates;
  otherTypes: { id: number; name: string }[];
  onAddOtherType?: () => void;
  onSave: (next: SalaryValue) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = React.useState<SalaryValue>(() => ({
    ...EMPTY,
    ...initialValue,
  }));
  const [enabledRates, setEnabledRates] = React.useState(() => ({
    overtime: initialValue?.hasOvertime ?? true,
    restday: initialValue?.hasRestday ?? true,
    holiday: initialValue?.hasHoliday ?? true,
    double: initialValue?.hasDouble ?? true,
    triple: initialValue?.hasTriple ?? true,
  }));
  const [hoursPerDay, setHoursPerDayState] = React.useState<number>(
    initialValue?.hoursPerDay ?? HOURS_PER_DAY,
  );
  const [daysPerMonth, setDaysPerMonthState] = React.useState<number>(
    initialValue?.daysPerMonth ?? rates.daysPerMonth,
  );

  const setType = (type: SalaryType) => {
    setDraft((d) => {
      if (type === "hour") {
        return { ...d, type, month: null };
      }
      if (type === "monthly") {
        return {
          ...d,
          type,
          hour:
            d.month === null
              ? null
              : round2(d.month / daysPerMonth / hoursPerDay),
        };
      }
      return { ...d, type };
    });
  };

  const setHour = (raw: string) => {
    const hour = parseNum(raw);
    setDraft((d) => {
      if (d.type === "hour") {
        return { ...d, hour, month: null };
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
          hour:
            month === null
              ? null
              : round2(month / daysPerMonth / hoursPerDay),
        };
      }
      return { ...d, month };
    });
  };

  const setHoursPerDay = (next: number) => {
    setHoursPerDayState(next);
    setDraft((d) => {
      if (d.type === "monthly" && d.month !== null) {
        return { ...d, hour: round2(d.month / daysPerMonth / next) };
      }
      return d;
    });
  };

  const setDaysPerMonth = (next: number) => {
    setDaysPerMonthState(next);
    setDraft((d) => {
      if (d.type === "monthly" && d.month !== null) {
        return { ...d, hour: round2(d.month / next / hoursPerDay) };
      }
      return d;
    });
  };

  const setOtherTypeId = (next: number | null) => {
    setDraft((d) => ({ ...d, otherTypeId: next }));
  };

  const isOther = draft.type === "other";

  const computeRate = (multiplier: number) =>
    draft.hour === null ? null : draft.hour * multiplier;

  const RATE_ROWS: {
    key: keyof typeof enabledRates;
    areaEnabled: boolean;
    label: string;
    multiplier: number;
    inputId: string;
    checkboxId: string;
  }[] = [
    {
      key: "overtime",
      areaEnabled: rates.hasOt,
      label: "Overtime",
      multiplier: rates.otRate,
      inputId: "salary-ot",
      checkboxId: "salary-ot-enabled",
    },
    {
      key: "restday",
      areaEnabled: rates.hasRd,
      label: "Restday",
      multiplier: rates.rdRate,
      inputId: "salary-rd",
      checkboxId: "salary-rd-enabled",
    },
    {
      key: "holiday",
      areaEnabled: rates.hasPh,
      label: "Public Holiday",
      multiplier: rates.phRate,
      inputId: "salary-ph",
      checkboxId: "salary-ph-enabled",
    },
    {
      key: "double",
      areaEnabled: rates.hasDbl,
      label: "Double pay",
      multiplier: 2,
      inputId: "salary-db",
      checkboxId: "salary-db-enabled",
    },
    {
      key: "triple",
      areaEnabled: rates.hasTpl,
      label: "Triple pay",
      multiplier: 3,
      inputId: "salary-tp",
      checkboxId: "salary-tp-enabled",
    },
  ];

  const setRateEnabled = (
    key: keyof typeof enabledRates,
    checked: boolean,
  ) => {
    setEnabledRates((current) => ({ ...current, [key]: checked }));
  };

  type LeftRow = {
    key: "hour" | "day" | "month";
    label: string;
    hint: React.ReactNode;
    inputId: string;
    value: number | null;
    editable: boolean;
    onChange?: (raw: string) => void;
  };

  const renderInlineNum = (
    prefix: string,
    val: number,
    onNum: (n: number) => void,
  ) => (
    <span className="inline-flex items-center justify-center gap-1">
      <span>{prefix}</span>
      <InlineNumInput value={val} onChange={onNum} />
    </span>
  );

  const LEFT_ROWS: LeftRow[] =
    draft.type === "hour"
      ? [
          {
            key: "hour",
            label: "Hour",
            hint: null,
            inputId: "salary-hour",
            value: draft.hour,
            editable: true,
            onChange: setHour,
          },
          {
            key: "day",
            label: "Day",
            hint: renderInlineNum("h×", hoursPerDay, setHoursPerDay),
            inputId: "salary-day",
            value:
              draft.hour === null ? null : round2(draft.hour * hoursPerDay),
            editable: false,
          },
        ]
      : [
          {
            key: "month",
            label: "Monthly",
            hint: null,
            inputId: "salary-month",
            value: draft.month,
            editable: true,
            onChange: setMonth,
          },
          {
            key: "day",
            label: "Day",
            hint: renderInlineNum("m/", daysPerMonth, setDaysPerMonth),
            inputId: "salary-day",
            value:
              draft.month === null ? null : round2(draft.month / daysPerMonth),
            editable: false,
          },
          {
            key: "hour",
            label: "Hour",
            hint: renderInlineNum("d/", hoursPerDay, setHoursPerDay),
            inputId: "salary-hour",
            value: draft.hour,
            editable: false,
          },
        ];

  const buildNextDraft = (): SalaryValue => {
    if (draft.type === "other") {
      return {
        ...draft,
        hour: null,
        month: null,
        hasOvertime: false,
        hasRestday: false,
        hasHoliday: false,
        hasDouble: false,
        hasTriple: false,
        hoursPerDay: null,
        daysPerMonth: null,
      };
    }

    return {
      ...draft,
      otherTypeId: null,
      month: draft.type === "monthly" ? draft.month : null,
      hasOvertime: rates.hasOt ? enabledRates.overtime : null,
      hasRestday: rates.hasRd ? enabledRates.restday : null,
      hasHoliday: rates.hasPh ? enabledRates.holiday : null,
      hasDouble: rates.hasDbl ? enabledRates.double : null,
      hasTriple: rates.hasTpl ? enabledRates.triple : null,
      hoursPerDay,
      daysPerMonth,
    };
  };

  return (
    <>
      <div className="flex gap-4 py-1">
        <div className="flex flex-1 flex-col gap-4">
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
              <Label htmlFor="salary-other">Type</Label>
              <Input
                id="salary-other"
                value={
                  otherTypes.find((t) => t.id === draft.otherTypeId)?.name ??
                  ""
                }
                readOnly
                placeholder={
                  otherTypes.length === 0
                    ? "No salary types yet"
                    : "Select from the list →"
                }
              />
            </div>
          )}
          {!isOther && (
            <div className="flex flex-col gap-1.5">
              <div className="text-sm font-medium">Basic</div>
              <Table>
                <TableBody>
                  {LEFT_ROWS.map((row) => (
                    <TableRow key={row.key}>
                      <TableCell>
                        <Label htmlFor={row.inputId} className="font-normal">
                          {row.label}
                        </Label>
                      </TableCell>
                      <TableCell className="text-center text-xs text-muted-foreground">
                        {row.hint ?? ""}
                      </TableCell>
                      <TableCell className="w-36">
                        <Input
                          id={row.inputId}
                          type="money"
                          value={
                            row.editable
                              ? format(row.value)
                              : format2dp(row.value)
                          }
                          onChange={
                            row.onChange
                              ? (e) => row.onChange!(e.target.value)
                              : undefined
                          }
                          readOnly={!row.editable}
                          clearable
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
        <Separator orientation="vertical" className="h-auto" />
        {isOther ? (
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium">Salary types</div>
              {onAddOtherType && (
                <Button type="button" size="xs" onClick={onAddOtherType}>
                  <PlusIcon /> Add
                </Button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto rounded-md border">
              {otherTypes.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground">
                  No salary types yet.
                </div>
              ) : (
                <Table>
                  <TableBody>
                    {otherTypes.map((t) => (
                      <TableRow
                        key={t.id}
                        onClick={() => setOtherTypeId(t.id)}
                        className={cn(
                          "cursor-pointer hover:bg-muted",
                          t.id === draft.otherTypeId && "bg-accent",
                        )}
                      >
                        <TableCell>{t.name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="text-sm font-medium">Multiplier table</div>
            <Table>
              <TableBody>
                {RATE_ROWS.filter((r) => r.areaEnabled).map((r) => {
                const enabled = enabledRates[r.key];
                const value = computeRate(r.multiplier);
                return (
                  <TableRow key={r.key}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={r.checkboxId}
                          checked={enabled}
                          onCheckedChange={(c) =>
                            setRateEnabled(r.key, c === true)
                          }
                        />
                        <Label
                          htmlFor={r.checkboxId}
                          className="font-normal"
                        >
                          {r.label}
                        </Label>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">
                      {r.multiplier}x
                      {draft.hour !== null ? format2dp(draft.hour) : ""}
                    </TableCell>
                    <TableCell className="w-36">
                      <div className="flex items-center gap-1">
                        <Input
                          id={r.inputId}
                          type="money"
                          value={enabled ? format2dp(value) : ""}
                          readOnly
                          disabled={!enabled}
                          clearable
                        />
                        <span className="text-xs text-muted-foreground">
                          /h
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" onClick={() => onSave(buildNextDraft())}>
          Save
        </Button>
      </DialogFooter>
    </>
  );
}
