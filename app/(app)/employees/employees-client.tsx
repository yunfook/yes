"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ArrowUpDownIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import {
  listEmployeesByArea,
  deleteEmployee,
  type EmployeeRow,
} from "./actions";
import { DeleteEmployeeDialog } from "./delete-employee-dialog";

export function EmployeesClient({ areaId }: { areaId: number }) {
  const qc = useQueryClient();
  const queryKey = ["employees", areaId] as const;

  const { data: rows = [], isPending } = useQuery({
    queryKey,
    queryFn: () => listEmployeesByArea(areaId),
  });

  const del = useMutation({
    mutationFn: ({ id }: { id: number }) => deleteEmployee(id, areaId),
    onSuccess: () => {
      toast.success("Employee deleted");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const [deleting, setDeleting] = React.useState<EmployeeRow | null>(null);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");

  const columns = React.useMemo<ColumnDef<EmployeeRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          >
            Name <ArrowUpDownIcon className="ml-2 size-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <Link
            href={`/employees/${row.original.id}?area=${areaId}`}
            className="font-medium hover:underline"
          >
            {row.original.name}
          </Link>
        ),
      },
      { accessorKey: "positionName", header: "Position" },
      {
        accessorKey: "nationality",
        header: "Nationality",
        cell: ({ row }) => row.original.nationality ?? "—",
      },
      {
        accessorKey: "gender",
        header: "Gender",
        cell: ({ row }) => row.original.gender ?? "—",
      },
      {
        accessorKey: "ic",
        header: "IC / Passport",
        cell: ({ row }) =>
          row.original.ic ?? row.original.passport ?? (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              render={
                <Link href={`/employees/${row.original.id}?area=${areaId}`} />
              }
            >
              <EyeIcon className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              render={
                <Link
                  href={`/employees/${row.original.id}/edit?area=${areaId}`}
                />
              }
            >
              <PencilIcon className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleting(row.original)}
            >
              <Trash2Icon className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [areaId],
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <>
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search…"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex-1" />
        <Button render={<Link href={`/employees/new?area=${areaId}`} />}>
          <PlusIcon className="size-4" /> New employee
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {h.isPlaceholder
                      ? null
                      : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isPending && (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isPending && table.getRowModel().rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
                  No employees yet.
                </TableCell>
              </TableRow>
            )}
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount() || 1}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      <DeleteEmployeeDialog
        item={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={(id) => del.mutate({ id })}
        pending={del.isPending}
      />
    </>
  );
}
