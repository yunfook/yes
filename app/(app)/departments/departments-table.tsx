"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { DepartmentSheet } from "./department-sheet";
import { DeleteDepartmentDialog } from "./delete-department-dialog";

type Item = { id: number; name: string; employeeCount: number };

export function DepartmentsTable({
  items,
  areaId,
}: {
  items: Item[];
  areaId: number;
}) {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Item | null>(null);
  const [deleting, setDeleting] = React.useState<Item | null>(null);

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon className="size-4" /> New department
        </Button>
      </div>
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
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No departments yet for this area.
                </TableCell>
              </TableRow>
            )}
            {items.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell className="text-right">{d.employeeCount}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => setEditing(d)}>
                    <PencilIcon className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleting(d)}>
                    <Trash2Icon className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DepartmentSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        areaId={areaId}
      />
      <DepartmentSheet
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        existing={editing ?? undefined}
        areaId={areaId}
      />
      <DeleteDepartmentDialog
        item={deleting}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
