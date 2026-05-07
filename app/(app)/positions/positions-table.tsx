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
import { PositionSheet } from "./position-sheet";
import { DeletePositionDialog } from "./delete-position-dialog";

type Item = { id: number; name: string; employeeCount: number };

export function PositionsTable({
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
          <PlusIcon className="size-4" /> New position
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
                  No positions yet for this area.
                </TableCell>
              </TableRow>
            )}
            {items.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="text-right">{p.employeeCount}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => setEditing(p)}>
                    <PencilIcon className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleting(p)}>
                    <Trash2Icon className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PositionSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        areaId={areaId}
      />
      <PositionSheet
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        existing={editing ?? undefined}
        areaId={areaId}
      />
      <DeletePositionDialog item={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}
