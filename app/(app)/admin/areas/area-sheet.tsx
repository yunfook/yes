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
import { createArea, updateArea } from "./actions";

const Schema = z.object({ name: z.string().trim().min(1, "Required").max(120) });

export function AreaSheet({
  open,
  onOpenChange,
  existing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing?: { id: number; name: string };
}) {
  const isEdit = !!existing;
  const form = useForm({
    defaultValues: { name: existing?.name ?? "" },
    validators: { onChange: Schema },
    onSubmit: async ({ value }) => {
      try {
        if (isEdit) await updateArea(existing!.id, value);
        else await createArea(value);
        toast.success(isEdit ? "Area updated" : "Area created");
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save");
      }
    },
  });

  React.useEffect(() => {
    if (open) form.reset({ name: existing?.name ?? "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, existing?.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit area" : "New area"}</DialogTitle>
          <DialogDescription>
            Areas group positions and employees. Names must be unique by convention.
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
