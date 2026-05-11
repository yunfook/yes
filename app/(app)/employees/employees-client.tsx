"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
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

export function EmployeesClient({
  areaId,
  initialData,
}: {
  areaId: number;
  initialData: EmployeeRow[];
}) {
  const qc = useQueryClient();
  const queryKey = ["employees", areaId] as const;

  const { data: rows = [], isPending } = useQuery({
    queryKey,
    queryFn: () => listEmployeesByArea(areaId),
    initialData,
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
        id: "index",
        header: "#",
        cell: ({ row, table }) =>
          table.getSortedRowModel().rows.findIndex((r) => r.id === row.id) + 1,
      },
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
      {
        accessorKey: "departmentName",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          >
            Department <ArrowUpDownIcon className="ml-2 size-3" />
          </Button>
        ),
        sortUndefined: "last",
        cell: ({ row }) =>
          row.original.departmentName ?? (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "positionName",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          >
            Positions <ArrowUpDownIcon className="ml-2 size-3" />
          </Button>
        ),
        sortUndefined: "last",
        cell: ({ row }) =>
          row.original.positionName ?? (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "salaryTypeLabel",
        accessorFn: (row) =>
          row.salaryType === "other"
            ? (row.otherSalaryTypeName ?? "Other")
            : row.salaryType === "hour"
              ? "Hour rate"
              : row.salaryType === "monthly"
                ? "Monthly paid"
                : null,
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          >
            Salary type <ArrowUpDownIcon className="ml-2 size-3" />
          </Button>
        ),
        sortUndefined: "last",
        cell: ({ getValue }) => {
          const v = getValue<string | null>();
          return v ?? <span className="text-muted-foreground">—</span>;
        },
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
              <Trash2Icon className="size-4 text-red-500" />
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
  });

  return (
    <>
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search…"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
          clearable
        />
        <div className="flex-1" />
        <Button render={<Link href={`/employees/new?area=${areaId}`} />}>
          <PlusIcon className="size-4" /> New employee
        </Button>
      </div>

      <div className="max-h-[calc(100vh-12rem)] overflow-y-auto rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
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

      <DeleteEmployeeDialog
        item={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={(id) => del.mutate({ id })}
        pending={del.isPending}
      />
    </>
  );
}
