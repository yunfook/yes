"use client";

import * as React from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HourPicker } from "@/components/form/wheel-pickers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { updateAreaSetting, type AreaSettingValues } from "./actions";
import { PayMultiplierDialog } from "./pay-multiplier-dialog";

type NumberKey = "hoursPerWeek" | "daysPerMonth";
type TimeKey = "workStart" | "workEnd";

type RowSpec =
  | {
      kind: "number";
      key: NumberKey;
      label: string;
      description: string;
    }
  | {
      kind: "time";
      key: TimeKey;
      label: string;
      description: string;
    };

const ROWS: RowSpec[] = [
  {
    kind: "number",
    key: "hoursPerWeek",
    label: "Weekly hours",
    description: "Hours used to calculate weekly salary from hourly rate.",
  },
  {
    kind: "number",
    key: "daysPerMonth",
    label: "Monthly days",
    description: "Days used to calculate day and hour rates from monthly pay.",
  },
  {
    kind: "time",
    key: "workStart",
    label: "Working start time",
    description: "Default start time for working schedules.",
  },
  {
    kind: "time",
    key: "workEnd",
    label: "Working end time",
    description: "Default end time for working schedules.",
  },
];

export function AreaSettingForm({
  areaId,
  initial,
}: {
  areaId: number;
  initial: AreaSettingValues;
}) {
  const [committed, setCommitted] = React.useState<AreaSettingValues>(initial);
  const [drafts, setDrafts] = React.useState<AreaSettingValues>(initial);
  const [savingKey, setSavingKey] =
    React.useState<keyof AreaSettingValues | null>(null);
  const [payMultiplierOpen, setPayMultiplierOpen] = React.useState(false);
  const qc = useQueryClient();

  const setNumber = (key: NumberKey, value: number) => {
    setDrafts((d) => ({ ...d, [key]: value }));
  };
  const setTime = (key: TimeKey, value: string) => {
    setDrafts((d) => ({ ...d, [key]: value }));
  };

  const isDirty = (key: keyof AreaSettingValues) =>
    drafts[key] !== committed[key];

  const save = async (key: keyof AreaSettingValues) => {
    setSavingKey(key);
    try {
      const next = { ...committed, [key]: drafts[key] };
      await updateAreaSetting(areaId, next);
      setCommitted(next);
      qc.invalidateQueries({ queryKey: ["areaSetting", areaId] });
      qc.invalidateQueries({ queryKey: ["employees", areaId] });
      toast.success("Saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead className="w-[180px]">Value</TableHead>
          <TableHead className="w-[120px]">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="align-top">
            <div className="font-medium">Pay multiplier</div>
            <div className="text-xs text-muted-foreground">
              Configure overtime, restday, holiday, double, and triple rates.
            </div>
          </TableCell>
          <TableCell>
            <Button
              type="button"
              size="sm"
              onClick={() => setPayMultiplierOpen(true)}
            >
              <SettingsIcon className="size-4" /> Setting
            </Button>
          </TableCell>
          <TableCell />
        </TableRow>
        {ROWS.map((row) => (
          <TableRow key={row.key}>
            <TableCell className="align-top">
              <div className="font-medium">{row.label}</div>
              <div className="text-xs text-muted-foreground">
                {row.description}
              </div>
            </TableCell>
            <TableCell>
              {row.kind === "number" ? (
                <Input
                  type="number"
                  min={
                    row.key === "hoursPerWeek" || row.key === "daysPerMonth"
                      ? 0.01
                      : 0
                  }
                  step="0.01"
                  value={
                    Number.isFinite(drafts[row.key])
                      ? String(drafts[row.key])
                      : ""
                  }
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setNumber(row.key, Number.isFinite(n) ? n : 0);
                  }}
                  className="w-32"
                  clearable
                />
              ) : (
                <HourPicker
                  value={drafts[row.key]}
                  onChange={(v) => setTime(row.key, v)}
                />
              )}
            </TableCell>
            <TableCell>
              <Button
                type="button"
                size="sm"
                disabled={!isDirty(row.key) || savingKey !== null}
                onClick={() => void save(row.key)}
              >
                {savingKey === row.key ? "Saving…" : "Save"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    <PayMultiplierDialog
      open={payMultiplierOpen}
      onOpenChange={setPayMultiplierOpen}
      areaId={areaId}
    />
    </>
  );
}
