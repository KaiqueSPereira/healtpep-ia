'use client';

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  Column,
  Row
} from "@tanstack/react-table";
import { ArrowUpDown, X } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/_components/ui/table";
import { Input } from "@/app/_components/ui/input";
import { Button } from "@/app/_components/ui/button";
import { BiomarkerActions } from "./BiomarkerActions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";

export interface BiomarkerData {
  name: string;
  category: string;
}

interface BiomarkersDataTableProps {
  data: BiomarkerData[];
  categories: string[];
  onActionComplete: () => void;
  columnFilters: ColumnFiltersState;
  setColumnFilters: React.Dispatch<React.SetStateAction<ColumnFiltersState>>;
}

export function BiomarkersDataTable({ 
  data, 
  categories, 
  onActionComplete, 
  columnFilters, 
  setColumnFilters 
}: BiomarkersDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const columns: ColumnDef<BiomarkerData>[] = React.useMemo(() => [
    {
      accessorKey: "name",
      header: ({ column }: { column: Column<BiomarkerData> }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nome do Biomarcador
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "category",
      header: ({ column }: { column: Column<BiomarkerData> }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Categoria
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      id: "actions",
      cell: ({ row }: { row: Row<BiomarkerData> }) => (
        <div className="text-right">
          <BiomarkerActions 
            biomarker={row.original}
            categories={categories}
            onActionComplete={onActionComplete}
          />
        </div>
      ),
    },
  ], [categories, onActionComplete]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div>
      <div className="flex items-center space-x-4 py-4">
        <Input
          placeholder="Filtrar por nome..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        
        <Select
          value={(table.getColumn("category")?.getFilterValue() as string) ?? ''}
          onValueChange={(value) => {
            // If the special value "all" is selected, clear the filter by setting it to an empty string
            // Otherwise, apply the selected value as the filter.
            table.getColumn("category")?.setFilterValue(value === "all" ? "" : value)
          }}
        >
          <SelectTrigger className="max-w-sm">
            <SelectValue placeholder="Filtrar por categoria..." />
          </SelectTrigger>
          <SelectContent>
            {/* Using a special, non-empty value for the "All Categories" option */}
            <SelectItem value="all">Todas as Categorias</SelectItem>
            <SelectItem value="Pendente">Pendente</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isFiltered && (
            <Button
              variant="ghost"
              onClick={() => table.resetColumnFilters()}
              className="h-8 px-2 lg:px-3"
            >
              Limpar filtros
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Nenhum resultado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
       <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Próximo
        </Button>
      </div>
    </div>
  );
}
