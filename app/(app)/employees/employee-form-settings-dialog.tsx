"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  updateEmployeeFormConfig,
  type EmployeeFormConfig,
} from "./actions";

const FIELDS: { key: keyof EmployeeFormConfig; label: string }[] = [
  { key: "dob", label: "Date of birth" },
  { key: "gender", label: "Gender" },
  { key: "contactNumber", label: "Contact number" },
  { key: "email", label: "Email" },
  { key: "positions", label: "Position" },
  { key: "departments", label: "Department" },
  { key: "nationality", label: "Nationality" },
  { key: "ic", label: "Identity Card" },
  { key: "passport", label: "Passport" },
  { key: "totalAnnualLeave", label: "Total Annual Leave" },
  { key: "totalSickLeave", label: "Total Sick Leave" },
];

export function EmployeeFormSettingsDialog({
  areaId,
  config,
}: {
  areaId: number;
  config: EmployeeFormConfig;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<EmployeeFormConfig>(config);
  const [pending, start] = React.useTransition();

  React.useEffect(() => {
    if (open) setDraft(config);
  }, [open, config]);

  const onSave = () => {
    start(async () => {
      try {
        await updateEmployeeFormConfig(areaId, draft);
        toast.success("Form fields updated");
        setOpen(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" className="text-primary" aria-label="Form field settings">
            <SettingsIcon className="size-4" />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Form fields</DialogTitle>
          <DialogDescription>
            Tick the fields you want to capture for employees in this area.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          {FIELDS.map((f) => {
            const id = `cfg-${f.key}`;
            return (
              <div key={f.key} className="flex items-center gap-2">
                <Checkbox
                  id={id}
                  checked={draft[f.key]}
                  onCheckedChange={(c) =>
                    setDraft((d) => ({ ...d, [f.key]: Boolean(c) }))
                  }
                />
                <Label htmlFor={id} className="cursor-pointer">
                  {f.label}
                </Label>
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button onClick={onSave} disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
