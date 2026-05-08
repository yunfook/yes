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
import { PencilIcon, PlusIcon, ShieldIcon, Trash2Icon } from "lucide-react";
import { UserSheet } from "./user-sheet";
import { DeleteUserDialog } from "./delete-user-dialog";
import { emailToUsername } from "@/lib/user-email";

export type UserItem = {
  id: number;
  email: string;
  name: string;
  isAdmin: boolean;
  areas: { id: number; name: string }[];
};

export function UsersTable({
  items,
  areas,
}: {
  items: UserItem[];
  areas: { id: number; name: string }[];
}) {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<UserItem | null>(null);
  const [deleting, setDeleting] = React.useState<UserItem | null>(null);

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon className="size-4" /> New user
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Areas</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No users yet.
                </TableCell>
              </TableRow>
            )}
            {items.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">
                  {emailToUsername(u.email)}
                </TableCell>
                <TableCell>{u.name}</TableCell>
                <TableCell>
                  {u.isAdmin ? (
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                      <ShieldIcon className="size-3" /> Super admin
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">User</span>
                  )}
                </TableCell>
                <TableCell>
                  {u.isAdmin ? (
                    <span className="text-sm text-muted-foreground">All areas</span>
                  ) : u.areas.length === 0 ? (
                    <span className="text-sm text-muted-foreground">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {u.areas.map((a) => (
                        <span
                          key={a.id}
                          className="rounded-md bg-muted px-2 py-0.5 text-xs"
                        >
                          {a.name}
                        </span>
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => setEditing(u)}>
                    <PencilIcon className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleting(u)}
                  >
                    <Trash2Icon className="size-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <UserSheet open={createOpen} onOpenChange={setCreateOpen} areas={areas} />
      <UserSheet
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        existing={editing ?? undefined}
        areas={areas}
      />
      <DeleteUserDialog item={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}
