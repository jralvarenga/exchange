'use client'

import { createColumnHelper, useTable } from '@tanstack/react-table'
import { cn } from '@workspace/ui/lib/utils'

import { DataTable } from '@/components/data-table'
import { DataTableFallback } from '@/components/data-table-fallback'
import { DataTablePagination } from '@/components/data-table-pagination'
import { PositionSymbol } from '@/components/portfolio/position-symbol'
import { useCursorPages } from '@/hooks/use-cursor-pages'
import { useOrdersPage } from '@/hooks/use-orders-and-positions'
import type { AccountOrder, PortfolioPosition } from '@/lib/alpaca/schemas'
import { type DataTableFeatures, dataTableFeatures } from '@/lib/table/features'
import { TABLE_PAGE_SIZE } from '@/lib/table/pagination'
import {
  formatCurrency,
  formatDateTime,
  formatLabel,
  formatQuantity,
} from '@/lib/utils'

const emptyOrders: AccountOrder[] = []

const settledStatuses = ['canceled', 'done_for_day', 'expired', 'replaced']

const columnHelper = createColumnHelper<DataTableFeatures, AccountOrder>()

const columns = columnHelper.columns([
  columnHelper.accessor((order) => order.symbol, {
    cell: (info) => {
      const order = info.row.original
      const isBuy = order.side === 'buy'

      return (
        <div className="flex items-center gap-3">
          <PositionSymbol
            assetClass={getAssetClass(order)}
            symbol={order.symbol}
          />
          <div className="flex flex-col">
            <span className="font-bold">{order.symbol}</span>
            <span className={cn(isBuy ? 'text-success' : 'text-danger')}>
              {isBuy ? 'Buy' : 'Sell'}
            </span>
          </div>
        </div>
      )
    },
    header: 'Asset',
    id: 'symbol',
  }),
  columnHelper.accessor((order) => order.type, {
    cell: (info) => (
      <span>
        {formatLabel(info.getValue())}
        <span className="text-muted-foreground">
          {' · '}
          {info.row.original.timeInForce.toUpperCase()}
        </span>
      </span>
    ),
    header: 'Type',
    id: 'type',
  }),
  columnHelper.accessor((order) => getOrderAmount(order), {
    cell: (info) => {
      const order = info.row.original

      if (order.quantity) {
        return formatQuantity(Number(order.quantity))
      }

      return order.notional ? formatCurrency(Number(order.notional)) : '—'
    },
    header: 'Amount',
    id: 'amount',
    meta: { align: 'end' },
  }),
  columnHelper.accessor((order) => getOrderPrice(order) ?? 0, {
    cell: (info) => {
      const price = getOrderPrice(info.row.original)

      return price === undefined ? '—' : formatCurrency(price)
    },
    header: 'Price',
    id: 'price',
    meta: { align: 'end' },
  }),
  columnHelper.accessor((order) => order.status, {
    cell: (info) => (
      <span className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={cn(
            'size-2 shrink-0 rounded-full',
            getStatusColor(info.getValue())
          )}
        />
        {formatLabel(info.getValue())}
      </span>
    ),
    header: 'Status',
    id: 'status',
  }),
  columnHelper.accessor((order) => order.submittedAt ?? order.createdAt ?? '', {
    cell: (info) =>
      info.getValue() === '' ? '—' : formatDateTime(info.getValue()),
    header: 'Submitted',
    id: 'submittedAt',
    meta: { align: 'end' },
  }),
])

/** Infers the logo asset class for orders Alpaca returns without one. */
function getAssetClass(order: AccountOrder): PortfolioPosition['assetClass'] {
  if (order.assetClass) {
    return order.assetClass
  }

  return order.symbol.includes('/') ? 'crypto' : 'us_equity'
}

/** Returns the sortable size of an order in shares or notional dollars. */
function getOrderAmount(order: AccountOrder): number {
  return Number(order.quantity ?? order.notional ?? 0)
}

/** Returns the most relevant order price: filled average, limit, then stop. */
function getOrderPrice(order: AccountOrder): number | undefined {
  const price =
    order.filledAveragePrice ?? order.limitPrice ?? order.stopPrice ?? undefined

  return price === undefined ? undefined : Number(price)
}

/** Maps an order status to the dot color that signals how it ended. */
function getStatusColor(status: string): string {
  if (status === 'filled') {
    return 'bg-success'
  }

  if (status === 'rejected') {
    return 'bg-danger'
  }

  if (settledStatuses.includes(status)) {
    return 'bg-muted-foreground'
  }

  return 'bg-warning'
}

/** Lists submitted orders one API page at a time so thousands of rows stay usable. */
export function OrdersTable() {
  const paging = useCursorPages()
  const query = useOrdersPage({
    beforeOrderId: paging.pageToken,
    limit: TABLE_PAGE_SIZE,
  })
  const orders = query.data?.orders ?? emptyOrders
  const lastOrderId = orders.at(-1)?.id
  const canNextPage =
    !query.isFetching &&
    orders.length === TABLE_PAGE_SIZE &&
    lastOrderId !== undefined
  const table = useTable({
    columns,
    data: orders,
    features: dataTableFeatures,
    initialState: { sorting: [{ desc: true, id: 'submittedAt' }] },
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
        caption="Submitted orders"
        className="min-w-4xl"
        emptyMessage="No orders yet. Orders you place will show up here."
        table={table}
      />
      {paging.pageIndex > 0 || canNextPage ? (
        <DataTablePagination
          canNextPage={canNextPage}
          canPreviousPage={paging.pageIndex > 0 && !query.isFetching}
          onNextPage={() => {
            if (lastOrderId) {
              paging.goNext(lastOrderId)
            }
          }}
          onPreviousPage={paging.goPrevious}
          pageIndex={paging.pageIndex}
          pageSize={TABLE_PAGE_SIZE}
          rowCount={orders.length}
        />
      ) : null}
    </div>
  )
}
