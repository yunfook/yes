"use client";

import * as React from "react";
import { CoinsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SalaryDialog, type SalaryRates } from "@/components/salary-dialog";
import { useSalaryStore } from "./salary-store";

const TYPE_LABEL: Record<string, string> = {
  hour: "Hour rate",
  monthly: "Monthly",
  other: "Other",
};

function format(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

export function SalaryDialogButton({ rates }: { rates: SalaryRates }) {
  const [open, setOpen] = React.useState(false);
  const salary = useSalaryStore((s) => s.salary);
  const setSalary = useSalaryStore((s) => s.setSalary);

  const summary = !salary
    ? "Set salary"
    : salary.type === "other"
      ? `${TYPE_LABEL.other} · ${salary.other ?? "—"}`
      : salary.hour === null && salary.day === null && salary.month === null
        ? "Set salary"
        : `${TYPE_LABEL[salary.type] ?? salary.type} · ${format(salary.hour)}/h · ${format(salary.day)}/d · ${format(salary.month)}/m`;

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <CoinsIcon />
        {summary}
      </Button>
      <SalaryDialog
        open={open}
        onOpenChange={setOpen}
        value={salary ?? undefined}
        onSave={setSalary}
        rates={rates}
      />
    </>
  );
}
