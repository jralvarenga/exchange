'use client'

import type { ReactTable, RowData } from '@tanstack/react-table'
import { Button } from '@workspace/ui/components/button'
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
import { useRouter } from 'next/navigation'
import type { KeyboardEvent } from 'react'

import type { DataTableFeatures } from '@/lib/table/features'

interface Props<TData extends RowData> {
  caption: string
  className?: string
  emptyMessage: string
  getRowHref?: (row: TData) => string | undefined
  table: ReactTable<DataTableFeatures, TData>
}

/** Renders a sortable, keyboard-operable table from a TanStack table instance. */
export function DataTable<TData extends RowData>({
  caption,
  className,
  emptyMessage,
  getRowHref,
  table,
}: Props<TData>) {
  const router = useRouter()
  const rows = table.getRowModel().rows
  const columnCount = table.getAllLeafColumns().length

  /** Navigates to the asset page when a row has a destination. */
  function openRow(row: TData): void {
    const href = getRowHref?.(row)

    if (href) {
      router.push(href)
    }
  }

  /** Opens a row with the keyboard when it has a destination. */
  function handleRowKeyDown(
    event: KeyboardEvent<HTMLTableRowElement>,
    row: TData
  ): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openRow(row)
    }
  }

  return (
    <div className="overflow-hidden">
      <Table className={cn('min-w-3xl', className)}>
        <TableCaption className="sr-only">{caption}</TableCaption>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const isEndAligned =
                  header.column.columnDef.meta?.align === 'end'
                const sortDirection = header.column.getIsSorted()
                const headerLabel =
                  typeof header.column.columnDef.header === 'string'
                    ? header.column.columnDef.header
                    : header.column.id

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
                    className={cn(isEndAligned && 'text-right')}
                    key={header.id}
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <Button
                        aria-label={`Sort ${headerLabel}`}
                        className="-mx-2.5"
                        size="sm"
                        variant="ghost"
                        onClick={(event) => {
                          event.stopPropagation()
                          header.column.getToggleSortingHandler()?.(event)
                        }}
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
                      </Button>
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
            <TableRow>
              <TableCell className="text-center" colSpan={columnCount}>
                <p className="py-10 text-muted-foreground">{emptyMessage}</p>
              </TableCell>
            </TableRow>
          ) : null}
          {rows.map((row) => {
            const href = getRowHref?.(row.original)

            return (
              <TableRow
                aria-label={href ? 'Open asset' : undefined}
                className={
                  href ? 'cursor-pointer focus-visible:bg-muted' : undefined
                }
                key={row.id}
                onClick={href ? () => openRow(row.original) : undefined}
                onKeyDown={
                  href
                    ? (event) => handleRowKeyDown(event, row.original)
                    : undefined
                }
                role={href ? 'link' : undefined}
                tabIndex={href ? 0 : undefined}
              >
                {row.getAllCells().map((cell) => (
                  <TableCell
                    className={cn(
                      cell.column.columnDef.meta?.align === 'end' &&
                        'text-right font-mono tabular-nums'
                    )}
                    key={cell.id}
                  >
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
