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
import { AreaSheet } from "./area-sheet";
import { DeleteAreaDialog } from "./delete-area-dialog";

type Item = {
  id: number;
  name: string;
  positionCount: number;
  employeeCount: number;
};

export function AreasTable({ items }: { items: Item[] }) {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Item | null>(null);
  const [deleting, setDeleting] = React.useState<Item | null>(null);

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon className="size-4" /> New area
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-32 text-right">Positions</TableHead>
              <TableHead className="w-32 text-right">Employees</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No areas yet.
                </TableCell>
              </TableRow>
            )}
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="text-right">{item.positionCount}</TableCell>
                <TableCell className="text-right">{item.employeeCount}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditing(item)}
                  >
                    <PencilIcon className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleting(item)}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AreaSheet open={createOpen} onOpenChange={setCreateOpen} />
      <AreaSheet
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        existing={editing ?? undefined}
      />
      <DeleteAreaDialog
        item={deleting}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
