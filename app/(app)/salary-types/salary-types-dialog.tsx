"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckIcon, PencilIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SalaryTypeSheet } from "./salary-type-sheet";
import { DeleteSalaryTypeDialog } from "./delete-salary-type-dialog";
import {
  listAllSalaryTypesWithCount,
  updateSalaryType,
  type SalaryTypeListItem,
} from "./actions";

export function SalaryTypesDialog({
  open,
  onOpenChange,
  areaId,
  areaName,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  areaId: number;
  areaName?: string;
}) {
  const router = useRouter();
  const [data, setData] = React.useState<{
    areaId: number;
    items: SalaryTypeListItem[];
  } | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState<{
    id: number;
    name: string;
  } | null>(null);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [editingName, setEditingName] = React.useState("");
  const [savingId, setSavingId] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    listAllSalaryTypesWithCount(areaId).then((items) => {
      if (!cancelled) setData({ areaId, items });
    });
    return () => {
      cancelled = true;
    };
  }, [open, areaId, refreshKey]);

  const items = data && data.areaId === areaId ? data.items : null;

  const refresh = () => {
    setRefreshKey((k) => k + 1);
    router.refresh();
  };

  const startEdit = (s: { id: number; name: string }) => {
    setEditingId(s.id);
    setEditingName(s.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const saveEdit = async (s: { id: number; name: string }) => {
    const name = editingName.trim();
    if (!name) {
      toast.error("Name is required");
      return;
    }
    if (name === s.name) {
      cancelEdit();
      return;
    }
    setSavingId(s.id);
    try {
      await updateSalaryType(s.id, { name, areaId });
      toast.success("Salary type updated");
      cancelEdit();
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Salary types{areaName ? ` · ${areaName}` : ""}
            </DialogTitle>
            <DialogDescription>
              Salary types belong to the currently selected area.
            </DialogDescription>
          </DialogHeader>

          {items === null ? (
            <div className="py-6 text-sm text-muted-foreground">Loading…</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-32 text-right">Employees</TableHead>
                    <TableHead className="w-32" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-muted-foreground"
                      >
                        No salary types yet for this area.
                      </TableCell>
                    </TableRow>
                  )}
                  {items.map((s) => {
                    if (s.builtIn) {
                      return (
                        <TableRow key={`builtin-${s.name}`}>
                          <TableCell className="font-medium">{s.name}</TableCell>
                          <TableCell className="text-right">
                            {s.employeeCount}
                          </TableCell>
                          <TableCell />
                        </TableRow>
                      );
                    }
                    const id = s.id as number;
                    const isEditing = editingId === id;
                    const isSaving = savingId === id;
                    const item = { id, name: s.name };
                    return (
                      <TableRow key={id}>
                        <TableCell className="font-medium">
                          {isEditing ? (
                            <Input
                              autoFocus
                              value={editingName}
                              disabled={isSaving}
                              onChange={(e) => setEditingName(e.target.value)}
                              clearable
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  void saveEdit(item);
                                } else if (e.key === "Escape") {
                                  e.preventDefault();
                                  cancelEdit();
                                }
                              }}
                              className="h-8"
                            />
                          ) : (
                            s.name
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {s.employeeCount}
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditing ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={isSaving}
                                onClick={() => void saveEdit(item)}
                                aria-label="Save"
                              >
                                <CheckIcon className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={isSaving}
                                onClick={cancelEdit}
                                aria-label="Cancel"
                              >
                                <XIcon className="size-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={editingId !== null}
                                onClick={() => startEdit(item)}
                                aria-label="Edit"
                              >
                                <PencilIcon className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={editingId !== null}
                                onClick={() => setDeleting(item)}
                                aria-label="Delete"
                              >
                                <Trash2Icon className="size-4 text-red-500" />
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setCreateOpen(true)}>
              <PlusIcon className="size-4" /> Add more
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SalaryTypeSheet
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) refresh();
        }}
        areaId={areaId}
      />
      <DeleteSalaryTypeDialog
        item={deleting}
        onClose={() => {
          setDeleting(null);
          refresh();
        }}
      />
    </>
  );
}
