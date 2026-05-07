"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/form/text-field";
import { createDepartment, updateDepartment } from "./actions";

const Schema = z.object({
  name: z.string().trim().min(1, "Required").max(120),
  areaId: z.number().int().positive(),
});

export function DepartmentSheet({
  open,
  onOpenChange,
  existing,
  areaId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  existing?: { id: number; name: string };
  areaId: number;
}) {
  const isEdit = !!existing;
  const form = useForm({
    defaultValues: { name: existing?.name ?? "", areaId },
    validators: { onChange: Schema },
    onSubmit: async ({ value }) => {
      try {
        if (isEdit) await updateDepartment(existing!.id, value);
        else await createDepartment(value);
        toast.success(isEdit ? "Department updated" : "Department created");
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    },
  });

  React.useEffect(() => {
    if (open) form.reset({ name: existing?.name ?? "", areaId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, existing?.id, areaId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit department" : "New department"}
          </DialogTitle>
          <DialogDescription>
            Department belongs to the currently selected area.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-1 flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
        >
          <TextField form={form} name="name" label="Name" required />
        </form>
        <DialogFooter>
          <Button
            type="button"
            disabled={form.state.isSubmitting}
            onClick={() => void form.handleSubmit()}
          >
            {form.state.isSubmitting ? "Saving…" : "Save"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
