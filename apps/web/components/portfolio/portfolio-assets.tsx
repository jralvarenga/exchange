'use client'

import { createColumnHelper, useTable } from '@tanstack/react-table'
import { useMemo, useState } from 'react'

import { AssetIcon } from '@/components/assets/asset-icon'
import { DataTable } from '@/components/data-table'
import { DataTablePagination } from '@/components/data-table-pagination'
import { PortfolioTableFilter } from '@/components/portfolio/portfolio-table-filter'
import { usePortfolio } from '@/hooks/use-portfolio'
import type { PortfolioPosition } from '@/lib/alpaca/schemas'
import { getSearchableAssetClass } from '@/lib/portfolio/asset-class'
import { getAssetHref } from '@/lib/portfolio/asset-href'
import { type DataTableFeatures, dataTableFeatures } from '@/lib/table/features'
import { PORTFOLIO_TABLE_PAGE_SIZE } from '@/lib/table/pagination'
import {
  formatCurrency,
  formatSignedCurrency,
  formatSignedPercent,
} from '@/lib/utils'

const columnHelper = createColumnHelper<DataTableFeatures, PortfolioPosition>()

const columns = columnHelper.columns([
  columnHelper.accessor('symbol', {
    cell: ({ getValue, row }) => (
      <span className="flex items-center gap-2">
        <AssetIcon
          assetClass={getSearchableAssetClass(row.original.assetClass)}
          symbol={getValue()}
        />
        <span className="font-medium">{getValue()}</span>
      </span>
    ),
    header: 'Asset',
  }),
  columnHelper.accessor('quantity', {
    header: 'Quantity',
    meta: { align: 'end' },
  }),
  columnHelper.accessor('marketValue', {
    cell: ({ getValue }) =>
      formatCurrency({ currency: 'USD', value: getValue() }),
    header: 'Market value',
    meta: { align: 'end' },
  }),
  columnHelper.accessor('unrealizedProfitLoss', {
    cell: ({ getValue }) =>
      formatSignedCurrency({ currency: 'USD', value: getValue() }),
    header: 'Unrealized P/L',
    meta: { align: 'end' },
  }),
  columnHelper.accessor('unrealizedProfitLossPercent', {
    cell: ({ getValue }) => formatSignedPercent({ value: getValue() }),
    header: 'Return',
    meta: { align: 'end' },
  }),
])

/** Renders open portfolio positions in a paginated, sortable data table. */
export function PortfolioAssets() {
  const { data } = usePortfolio()
  const [filter, setFilter] = useState('')
  const filteredPositions = useMemo(() => {
    const query = filter.trim().toLocaleLowerCase('en-US')

    if (!query) {
      return data.positions
    }

    return data.positions.filter((position) =>
      position.symbol.toLocaleLowerCase('en-US').includes(query)
    )
  }, [data.positions, filter])
  const table = useTable({
    columns,
    data: filteredPositions,
    features: dataTableFeatures,
    getRowId: (position) => position.assetId,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: PORTFOLIO_TABLE_PAGE_SIZE,
      },
    },
  })

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PortfolioTableFilter
        id="portfolio-assets-filter"
        onChange={setFilter}
        placeholder="Filter assets…"
        value={filter}
      />
      <div className="min-h-0 flex-1 overflow-auto">
        <DataTable
          caption="Open portfolio positions"
          className="min-w-full"
          emptyMessage="No open positions yet."
          getRowHref={(position) =>
            getAssetHref({
              assetId: position.assetId,
              symbol: position.symbol,
            })
          }
          table={table}
        />
      </div>
      <DataTablePagination
        canNextPage={table.getCanNextPage()}
        canPreviousPage={table.getCanPreviousPage()}
        onNextPage={() => table.nextPage()}
        onPreviousPage={() => table.previousPage()}
        pageIndex={table.state.pagination.pageIndex}
        pageSize={PORTFOLIO_TABLE_PAGE_SIZE}
        rowCount={table.getRowModel().rows.length}
      />
    </div>
  )
}
