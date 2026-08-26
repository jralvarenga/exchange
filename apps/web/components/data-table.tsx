'use client'

import type { ReactTable, RowData } from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table'
import { cn } from '@workspace/ui/lib/utils'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'

import type { DataTableFeatures } from '@/lib/table/features'

interface Props<TData extends RowData> {
  caption: string
  className?: string
  emptyMessage: string
  table: ReactTable<DataTableFeatures, TData>
}

/** Renders a sortable, keyboard-operable table from a TanStack table instance. */
export function DataTable<TData extends RowData>({
  caption,
  className,
  emptyMessage,
  table,
}: Props<TData>) {
  const rows = table.getRowModel().rows
  const columnCount = table.getAllLeafColumns().length

  return (
    <div className="overflow-hidden">
      <Table className={cn('min-w-3xl', className)}>
        <TableCaption className="sr-only">{caption}</TableCaption>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow className="hover:bg-transparent" key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const isEndAligned =
                  header.column.columnDef.meta?.align === 'end'
                const sortDirection = header.column.getIsSorted()

                return (
                  <TableHead
                    aria-sort={
                      header.column.getCanSort()
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : sortDirection === 'desc'
                            ? 'descending'
                            : 'none'
                        : undefined
                    }
                    className={cn(
                      'first:pl-5 last:pr-5',
                      isEndAligned && 'text-right'
                    )}
                    key={header.id}
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        className="-mx-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 outline-none transition-colors hover:text-foreground/70 focus-visible:ring-3 focus-visible:ring-ring"
                        onClick={header.column.getToggleSortingHandler()}
                        type="button"
                      >
                        <table.FlexRender header={header} />
                        {sortDirection === 'asc' ? (
                          <ArrowUp aria-hidden="true" className="size-4" />
                        ) : sortDirection === 'desc' ? (
                          <ArrowDown aria-hidden="true" className="size-4" />
                        ) : (
                          <ChevronsUpDown
                            aria-hidden="true"
                            className="size-4 text-muted-foreground"
                          />
                        )}
                      </button>
                    ) : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                className="h-28 px-5 text-center text-muted-foreground"
                colSpan={columnCount}
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : null}
          {rows.map((row) => (
            <TableRow key={row.id}>
              {row.getAllCells().map((cell) => (
                <TableCell
                  className={cn(
                    'py-3 first:pl-5 last:pr-5',
                    cell.column.columnDef.meta?.align === 'end' &&
                      'text-right font-mono tabular-nums'
                  )}
                  key={cell.id}
                >
                  <table.FlexRender cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
