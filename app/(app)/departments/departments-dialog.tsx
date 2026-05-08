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
import { DepartmentSheet } from "./department-sheet";
import { DeleteDepartmentDialog } from "./delete-department-dialog";
import {
  listDepartmentsWithCount,
  updateDepartment,
  type DepartmentWithCount,
} from "./actions";

export function DepartmentsDialog({
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
    items: DepartmentWithCount[];
  } | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState<DepartmentWithCount | null>(
    null,
  );
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [editingName, setEditingName] = React.useState("");
  const [savingId, setSavingId] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    listDepartmentsWithCount(areaId).then((items) => {
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

  const startEdit = (d: DepartmentWithCount) => {
    setEditingId(d.id);
    setEditingName(d.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const saveEdit = async (d: DepartmentWithCount) => {
    const name = editingName.trim();
    if (!name) {
      toast.error("Name is required");
      return;
    }
    if (name === d.name) {
      cancelEdit();
      return;
    }
    setSavingId(d.id);
    try {
      await updateDepartment(d.id, { name, areaId });
      toast.success("Department updated");
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
              Departments{areaName ? ` · ${areaName}` : ""}
            </DialogTitle>
            <DialogDescription>
              Departments belong to the currently selected area.
            </DialogDescription>
          </DialogHeader>

          {items === null ? (
            <div className="py-6 text-sm text-muted-foreground">Loading…</div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-32 text-right">
                      Employees
                    </TableHead>
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
                        No departments yet for this area.
                      </TableCell>
                    </TableRow>
                  )}
                  {items.map((d) => {
                    const isEditing = editingId === d.id;
                    const isSaving = savingId === d.id;
                    return (
                      <TableRow key={d.id}>
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
                                  void saveEdit(d);
                                } else if (e.key === "Escape") {
                                  e.preventDefault();
                                  cancelEdit();
                                }
                              }}
                              className="h-8"
                            />
                          ) : (
                            d.name
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {d.employeeCount}
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditing ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={isSaving}
                                onClick={() => void saveEdit(d)}
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
                                onClick={() => startEdit(d)}
                                aria-label="Edit"
                              >
                                <PencilIcon className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={editingId !== null}
                                onClick={() => setDeleting(d)}
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

      <DepartmentSheet
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) refresh();
        }}
        areaId={areaId}
      />
      <DeleteDepartmentDialog
        item={deleting}
        onClose={() => {
          setDeleting(null);
          refresh();
        }}
      />
    </>
  );
}
