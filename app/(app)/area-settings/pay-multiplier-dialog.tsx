"use client";

import * as React from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getPayMultiplier,
  updatePayMultiplier,
  type PayMultiplierUpdate,
  type PayMultiplierValues,
} from "./actions";

type FlagKey = "hasOt" | "hasRd" | "hasPh" | "hasDbl" | "hasTpl";
type RateKey = "otRate" | "rdRate" | "phRate";

type RowSpec = {
  hasKey: FlagKey;
  label: string;
} & ({ rateKey: RateKey } | { fixedRate: number });

const ROWS: RowSpec[] = [
  { hasKey: "hasOt", label: "Overtime", rateKey: "otRate" },
  { hasKey: "hasRd", label: "Restday", rateKey: "rdRate" },
  { hasKey: "hasPh", label: "Public Holiday", rateKey: "phRate" },
  { hasKey: "hasDbl", label: "Double pay", fixedRate: 2 },
  { hasKey: "hasTpl", label: "Triple pay", fixedRate: 3 },
];

export function PayMultiplierDialog({
  open,
  onOpenChange,
  areaId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  areaId: number;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pay multiplier</DialogTitle>
        </DialogHeader>
        {open ? (
          <PayMultiplierBody
            areaId={areaId}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function PayMultiplierBody({
  areaId,
  onClose,
}: {
  areaId: number;
  onClose: () => void;
}) {
  const { data } = useQuery({
    queryKey: ["payMultiplier", areaId],
    queryFn: () => getPayMultiplier(areaId),
  });

  if (!data) {
    return (
      <div className="py-6 text-sm text-muted-foreground">Loading…</div>
    );
  }

  return (
    <PayMultiplierForm initial={data} areaId={areaId} onClose={onClose} />
  );
}

function PayMultiplierForm({
  initial,
  areaId,
  onClose,
}: {
  initial: PayMultiplierValues;
  areaId: number;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [draft, setDraft] = React.useState<PayMultiplierUpdate>({
    hasOt: initial.hasOt,
    hasRd: initial.hasRd,
    hasPh: initial.hasPh,
    hasDbl: initial.hasDbl,
    hasTpl: initial.hasTpl,
    otRate: initial.otRate,
    rdRate: initial.rdRate,
    phRate: initial.phRate,
  });

  const mutation = useMutation({
    mutationFn: (values: PayMultiplierUpdate) =>
      updatePayMultiplier(areaId, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payMultiplier", areaId] });
      qc.invalidateQueries({ queryKey: ["employees", areaId] });
      toast.success("Saved");
      onClose();
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "Failed"),
  });

  const setFlag = (key: FlagKey, checked: boolean) =>
    setDraft((d) => ({ ...d, [key]: checked }));
  const setRate = (key: RateKey, value: number) =>
    setDraft((d) => ({ ...d, [key]: value }));

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="w-[140px]">Rate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ROWS.map((row) => {
            const id = `pm-${row.hasKey}`;
            const checked = draft[row.hasKey];
            const editable = "rateKey" in row;
            return (
              <TableRow key={row.hasKey}>
                <TableCell>
                  <Label
                    htmlFor={id}
                    className="flex items-center gap-2 font-normal"
                  >
                    <Checkbox
                      id={id}
                      checked={checked}
                      onCheckedChange={(c) => setFlag(row.hasKey, c === true)}
                    />
                    {row.label}
                  </Label>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {editable ? (
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={String(draft[row.rateKey])}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          setRate(row.rateKey, Number.isFinite(n) ? n : 0);
                        }}
                        className="w-20"
                      />
                    ) : (
                      <Input
                        type="text"
                        value={String(row.fixedRate)}
                        disabled
                        className="w-20"
                      />
                    )}
                    <span className="text-xs text-muted-foreground">x</span>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={mutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={() => mutation.mutate(draft)}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </>
  );
}
