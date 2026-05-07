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
import { deletePosition } from "./actions";

export function DeletePositionDialog({
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
          <DialogTitle>Delete position?</DialogTitle>
          <DialogDescription>
            <strong>{item?.name}</strong> will be deleted. Employees that
            referenced this position will have it cleared.
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
                  await deletePosition(item.id);
                  toast.success("Position deleted");
                  onClose();
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Failed");
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
