'use client'

import { createColumnHelper, useTable } from '@tanstack/react-table'
import { cn } from '@workspace/ui/lib/utils'

import { DataTable } from '@/components/data-table'
import { DataTableFallback } from '@/components/data-table-fallback'
import { DataTablePagination } from '@/components/data-table-pagination'
import { PositionSymbol } from '@/components/portfolio/position-symbol'
import { useAccountActivitiesPage } from '@/hooks/use-account-activities'
import { useCursorPages } from '@/hooks/use-cursor-pages'
import type { AccountActivity, PortfolioPosition } from '@/lib/alpaca/schemas'
import { type DataTableFeatures, dataTableFeatures } from '@/lib/table/features'
import { TABLE_PAGE_SIZE } from '@/lib/table/pagination'
import {
  formatCurrency,
  formatDateTime,
  formatLabel,
  formatQuantity,
} from '@/lib/utils'

const emptyActivities: AccountActivity[] = []

const columnHelper = createColumnHelper<DataTableFeatures, AccountActivity>()

const columns = columnHelper.columns([
  columnHelper.accessor(
    (activity) => activity.symbol ?? activity.activityType,
    {
      cell: (info) => {
        const activity = info.row.original
        const symbol = activity.symbol

        return (
          <div className="flex items-center gap-3">
            {symbol ? (
              <PositionSymbol
                assetClass={getAssetClass(symbol)}
                symbol={symbol}
              />
            ) : null}
            <div className="flex flex-col">
              <span className="font-bold">
                {symbol ?? formatLabel(activity.activityType)}
              </span>
              {symbol ? (
                <span className="text-muted-foreground">
                  {formatLabel(activity.activityType)}
                </span>
              ) : null}
            </div>
          </div>
        )
      },
      header: 'Activity',
      id: 'activity',
    }
  ),
  columnHelper.accessor((activity) => activity.side ?? '', {
    cell: (info) => {
      const side = info.getValue()

      if (!side) {
        return '—'
      }

      return (
        <span className={cn(side === 'buy' ? 'text-success' : 'text-danger')}>
          {formatLabel(side)}
        </span>
      )
    },
    header: 'Side',
    id: 'side',
  }),
  columnHelper.accessor((activity) => activity.quantity ?? '', {
    cell: (info) => {
      const quantity = info.getValue()

      if (!quantity) {
        return '—'
      }

      const amount = Number(quantity)

      return Number.isFinite(amount) ? formatQuantity(amount) : quantity
    },
    header: 'Quantity',
    id: 'quantity',
    meta: { align: 'end' },
  }),
  columnHelper.accessor((activity) => activity.price ?? '', {
    cell: (info) => formatOptionalCurrency(info.getValue()),
    header: 'Price',
    id: 'price',
    meta: { align: 'end' },
  }),
  columnHelper.accessor((activity) => activity.netAmount ?? '', {
    cell: (info) => formatOptionalCurrency(info.getValue()),
    header: 'Net',
    id: 'netAmount',
    meta: { align: 'end' },
  }),
  columnHelper.accessor(
    (activity) => activity.transactionTime ?? activity.date ?? '',
    {
      cell: (info) =>
        info.getValue() === '' ? '—' : formatDateTime(info.getValue()),
      header: 'Time',
      id: 'time',
      meta: { align: 'end' },
    }
  ),
])

/** Infers a logo class for activity symbols that do not include one. */
function getAssetClass(symbol: string): PortfolioPosition['assetClass'] {
  return symbol.includes('/') ? 'crypto' : 'us_equity'
}

/** Formats a string amount as currency, or a dash when the value is missing. */
function formatOptionalCurrency(value: string): string {
  if (!value) {
    return '—'
  }

  const amount = Number(value)

  return Number.isFinite(amount) ? formatCurrency(amount) : value
}

/** Lists account activity one API page at a time so thousands of rows stay usable. */
export function ActivitiesTable() {
  const paging = useCursorPages()
  const query = useAccountActivitiesPage({
    pageSize: TABLE_PAGE_SIZE,
    pageToken: paging.pageToken,
  })
  const activities = query.data?.activities ?? emptyActivities
  const nextPageToken = query.data?.nextPageToken
  const canNextPage = !query.isFetching && nextPageToken !== undefined
  const table = useTable({
    columns,
    data: activities,
    features: dataTableFeatures,
    initialState: { sorting: [{ desc: true, id: 'time' }] },
  })

  if (query.isPending) {
    return <DataTableFallback />
  }

  if (query.isError) {
    throw query.error
  }

  return (
    <div>
      <DataTable
        caption="Account activity"
        className="min-w-4xl"
        emptyMessage="No activity yet. Fills, dividends, and transfers will show up here."
        table={table}
      />
      {paging.pageIndex > 0 || canNextPage ? (
        <DataTablePagination
          canNextPage={canNextPage}
          canPreviousPage={paging.pageIndex > 0 && !query.isFetching}
          onNextPage={() => {
            if (nextPageToken) {
              paging.goNext(nextPageToken)
            }
          }}
          onPreviousPage={paging.goPrevious}
          pageIndex={paging.pageIndex}
          pageSize={TABLE_PAGE_SIZE}
          rowCount={activities.length}
        />
      ) : null}
    </div>
  )
}
