'use client'

import { createColumnHelper, useTable } from '@tanstack/react-table'
import { cn } from '@workspace/ui/lib/utils'

import { DataTable } from '@/components/data-table'
import { PositionSymbol } from '@/components/portfolio/position-symbol'
import type { PortfolioPosition } from '@/lib/alpaca/schemas'
import { type DataTableFeatures, dataTableFeatures } from '@/lib/table/features'
import {
  formatCurrency,
  formatQuantity,
  formatSignedCurrency,
  formatSignedPercent,
} from '@/lib/utils'

interface Props {
  positions: PortfolioPosition[]
}

const columnHelper = createColumnHelper<DataTableFeatures, PortfolioPosition>()

const columns = columnHelper.columns([
  columnHelper.accessor('symbol', {
    cell: (info) => (
      <div className="flex items-center gap-3">
        <PositionSymbol
          assetClass={info.row.original.assetClass}
          symbol={info.getValue()}
        />
        <span className="font-bold">{info.getValue()}</span>
      </div>
    ),
    header: 'Asset',
  }),
  columnHelper.accessor('currentPrice', {
    cell: (info) => formatCurrency(info.getValue()),
    header: 'Price',
    meta: { align: 'end' },
  }),
  columnHelper.accessor('quantity', {
    cell: (info) => formatQuantity(info.getValue()),
    header: 'Quantity',
    meta: { align: 'end' },
  }),
  columnHelper.accessor('marketValue', {
    cell: (info) => formatCurrency(info.getValue()),
    header: 'Market value',
    meta: { align: 'end' },
  }),
  columnHelper.accessor('unrealizedProfitLoss', {
    cell: (info) => {
      const position = info.row.original
      const isGain = info.getValue() >= 0

      return (
        <span
          className={cn('font-medium', isGain ? 'text-success' : 'text-danger')}
        >
          <span className="sr-only">{isGain ? 'Gain' : 'Loss'}: </span>
          {formatSignedCurrency(info.getValue())} (
          {formatSignedPercent(position.unrealizedProfitLossPercent)})
        </span>
      )
    },
    header: 'Total P/L',
    meta: { align: 'end' },
  }),
])

/** Lists every open position with sortable price, size, and profit columns. */
export function PositionsTable({ positions }: Props) {
  const table = useTable({
    columns,
    data: positions,
    features: dataTableFeatures,
    initialState: { sorting: [{ desc: true, id: 'marketValue' }] },
  })

  return (
    <DataTable
      caption="Open positions"
      emptyMessage="No assets yet. Buy an asset and it will show up here."
      table={table}
    />
  )
}
