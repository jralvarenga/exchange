'use client'

import { createColumnHelper, useTable } from '@tanstack/react-table'
import { useMemo, useState } from 'react'

import { AssetIcon } from '@/components/assets/asset-icon'
import { DataTable } from '@/components/data-table'
import { DataTablePagination } from '@/components/data-table-pagination'
import { PortfolioOrdersFallback } from '@/components/portfolio/portfolio-orders-fallback'
import { PortfolioTableFilter } from '@/components/portfolio/portfolio-table-filter'
import { useCursorPages } from '@/hooks/use-cursor-pages'
import { useOrdersPage } from '@/hooks/use-orders-and-positions'
import { getActivityAssetClass } from '@/lib/activity/format-activity'
import type { AccountOrder } from '@/lib/alpaca/schemas'
import { getSearchableAssetClass } from '@/lib/portfolio/asset-class'
import { getAssetHref } from '@/lib/portfolio/asset-href'
import { type DataTableFeatures, dataTableFeatures } from '@/lib/table/features'
import { PORTFOLIO_TABLE_PAGE_SIZE } from '@/lib/table/pagination'

const columnHelper = createColumnHelper<DataTableFeatures, AccountOrder>()
const orderTimeFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

/** Formats an order quantity or notional amount for display. */
function formatOrderAmount(order: AccountOrder): string {
  if (order.quantity) {
    return order.quantity
  }

  if (order.notional) {
    return order.notional
  }

  return '—'
}

/** Formats an order submission time for display. */
function formatSubmittedAt(submittedAt: string | null): string {
  if (!submittedAt) {
    return 'Date unavailable'
  }

  return orderTimeFormatter.format(new Date(submittedAt))
}

const columns = columnHelper.columns([
  columnHelper.accessor('symbol', {
    cell: ({ getValue, row }) => (
      <span className="flex items-center gap-2">
        <AssetIcon
          assetClass={getSearchableAssetClass(
            row.original.assetClass ?? getActivityAssetClass(getValue())
          )}
          symbol={getValue()}
        />
        <span className="font-medium">{getValue()}</span>
      </span>
    ),
    header: 'Asset',
  }),
  columnHelper.accessor('side', {
    cell: ({ getValue }) => (getValue() === 'buy' ? 'Buy' : 'Sell'),
    header: 'Side',
  }),
  columnHelper.accessor('type', {
    cell: ({ getValue }) => getValue().replaceAll('_', ' '),
    header: 'Type',
  }),
  columnHelper.accessor('status', {
    header: 'Status',
  }),
  columnHelper.accessor((order) => formatOrderAmount(order), {
    header: 'Quantity',
    id: 'quantity',
    meta: { align: 'end' },
  }),
  columnHelper.accessor('submittedAt', {
    cell: ({ getValue }) => formatSubmittedAt(getValue()),
    header: 'Submitted',
  }),
])

/** Renders account orders in a paginated, sortable data table. */
export function PortfolioOrders() {
  const [filter, setFilter] = useState('')
  const pages = useCursorPages()
  const query = useOrdersPage({
    beforeOrderId: pages.pageToken,
    direction: 'desc',
    limit: PORTFOLIO_TABLE_PAGE_SIZE,
  })
  const orders = query.data?.orders ?? []
  const filteredOrders = useMemo(() => {
    const queryText = filter.trim().toLocaleLowerCase('en-US')

    if (!queryText) {
      return orders
    }

    return orders.filter((order) =>
      order.symbol.toLocaleLowerCase('en-US').includes(queryText)
    )
  }, [filter, orders])
  const table = useTable({
    columns,
    data: filteredOrders,
    features: dataTableFeatures,
    getRowId: (order) => order.id,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: PORTFOLIO_TABLE_PAGE_SIZE,
      },
    },
    manualPagination: true,
  })
  const lastOrder = orders.at(-1)
  const canNextPage =
    Boolean(lastOrder) && orders.length === PORTFOLIO_TABLE_PAGE_SIZE

  if (query.isPending && !query.data) {
    return <PortfolioOrdersFallback />
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PortfolioTableFilter
        id="portfolio-orders-filter"
        onChange={setFilter}
        placeholder="Filter orders…"
        value={filter}
      />
      <div className="min-h-0 flex-1 overflow-auto">
        <DataTable
          caption="Account orders"
          className="min-w-full"
          emptyMessage="No orders yet."
          getRowHref={(order) => getAssetHref({ symbol: order.symbol })}
          table={table}
        />
      </div>
      <DataTablePagination
        canNextPage={canNextPage}
        canPreviousPage={pages.pageIndex > 0}
        onNextPage={() => {
          if (lastOrder) {
            pages.goNext(lastOrder.id)
          }
        }}
        onPreviousPage={pages.goPrevious}
        pageIndex={pages.pageIndex}
        pageSize={PORTFOLIO_TABLE_PAGE_SIZE}
        rowCount={filteredOrders.length}
      />
    </div>
  )
}
