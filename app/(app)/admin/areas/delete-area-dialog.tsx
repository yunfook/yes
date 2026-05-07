"use client";

import * as React from "react";
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
import { deleteArea } from "./actions";

export function DeleteAreaDialog({
  item,
  onClose,
}: {
  item: { id: number; name: string } | null;
  onClose: () => void;
}) {
  const [pending, start] = React.useTransition();

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete area?</DialogTitle>
          <DialogDescription>
            This will permanently delete <strong>{item?.name}</strong> and cascade
            to its positions, employees, and user assignments.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              start(async () => {
                if (!item) return;
                try {
                  await deleteArea(item.id);
                  toast.success("Area deleted");
                  onClose();
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Failed to delete");
                }
              })
            }
          >
            {pending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
