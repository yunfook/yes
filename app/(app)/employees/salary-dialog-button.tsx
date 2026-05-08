"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, CoinsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SalaryDialog, type SalaryRates } from "@/components/salary-dialog";
import { useEmployeeDraftStore } from "./employee-draft-store";
import { SalaryTypeSheet } from "../salary-types/salary-type-sheet";

export function SalaryDialogButton({
  rates,
  otherTypes,
  areaId,
}: {
  rates: SalaryRates;
  otherTypes: { id: number; name: string }[];
  areaId: number;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);
  const salary = useEmployeeDraftStore((s) => s.salary);
  const setSalary = useEmployeeDraftStore((s) => s.setSalary);

  const filled =
    !!salary &&
    (salary.type === "other"
      ? salary.otherTypeId != null
      : salary.hour != null ||
        salary.day != null ||
        salary.week != null ||
        salary.month != null);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <CoinsIcon />
        Set salary
        {filled && <CheckIcon className="ml-1 size-3.5" />}
      </Button>
      <SalaryDialog
        open={open}
        onOpenChange={setOpen}
        value={salary ?? undefined}
        onSave={setSalary}
        rates={rates}
        otherTypes={otherTypes}
        onAddOtherType={() => setAddOpen(true)}
      />
      <SalaryTypeSheet
        open={addOpen}
        onOpenChange={(o) => {
          setAddOpen(o);
          if (!o) router.refresh();
        }}
        areaId={areaId}
      />
    </>
  );
}
