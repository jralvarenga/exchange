'use client'

import { createColumnHelper, useTable } from '@tanstack/react-table'
import { useMemo, useState } from 'react'

import { AssetIcon } from '@/components/assets/asset-icon'
import { DataTable } from '@/components/data-table'
import { DataTablePagination } from '@/components/data-table-pagination'
import { PortfolioActivityFallback } from '@/components/portfolio/portfolio-activity-fallback'
import { PortfolioTableFilter } from '@/components/portfolio/portfolio-table-filter'
import { useAccountActivitiesPage } from '@/hooks/use-account-activities'
import { useCursorPages } from '@/hooks/use-cursor-pages'
import {
  formatActivityDetail,
  formatActivitySide,
  formatActivityTime,
  getActivityAssetClass,
} from '@/lib/activity/format-activity'
import type { AccountActivity } from '@/lib/alpaca/schemas'
import { getAssetHref } from '@/lib/portfolio/asset-href'
import { type DataTableFeatures, dataTableFeatures } from '@/lib/table/features'
import { PORTFOLIO_TABLE_PAGE_SIZE } from '@/lib/table/pagination'

const columnHelper = createColumnHelper<DataTableFeatures, AccountActivity>()

const columns = columnHelper.columns([
  columnHelper.accessor(
    (activity) => activity.symbol ?? activity.activityType,
    {
      cell: ({ getValue, row }) => (
        <span className="flex items-center gap-2">
          {row.original.symbol ? (
            <AssetIcon
              assetClass={getActivityAssetClass(row.original.symbol)}
              symbol={row.original.symbol}
            />
          ) : null}
          <span className="font-medium">{getValue()}</span>
        </span>
      ),
      header: 'Asset',
      id: 'asset',
    }
  ),
  columnHelper.accessor('side', {
    cell: ({ getValue }) => formatActivitySide(getValue()),
    header: 'Side',
  }),
  columnHelper.accessor('activityType', {
    cell: ({ getValue }) => getValue().replaceAll('_', ' '),
    header: 'Type',
  }),
  columnHelper.accessor((activity) => formatActivityDetail({ activity }), {
    header: 'Amount',
    id: 'amount',
    meta: { align: 'end' },
  }),
  columnHelper.accessor((activity) => formatActivityTime(activity), {
    header: 'Time',
    id: 'time',
  }),
])

/** Renders account activity in a paginated, sortable data table. */
export function PortfolioActivity() {
  const [filter, setFilter] = useState('')
  const pages = useCursorPages()
  const query = useAccountActivitiesPage({
    category: 'trade_activity',
    direction: 'desc',
    pageSize: PORTFOLIO_TABLE_PAGE_SIZE,
    pageToken: pages.pageToken,
  })
  const activities = query.data?.activities ?? []
  const filteredActivities = useMemo(() => {
    const queryText = filter.trim().toLocaleLowerCase('en-US')

    if (!queryText) {
      return activities
    }

    return activities.filter((activity) => {
      const symbol = activity.symbol?.toLocaleLowerCase('en-US') ?? ''
      const type = activity.activityType.toLocaleLowerCase('en-US')

      return symbol.includes(queryText) || type.includes(queryText)
    })
  }, [activities, filter])
  const table = useTable({
    columns,
    data: filteredActivities,
    features: dataTableFeatures,
    getRowId: (activity) => activity.id,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: PORTFOLIO_TABLE_PAGE_SIZE,
      },
    },
    manualPagination: true,
  })
  const nextPageToken = query.data?.nextPageToken

  if (query.isPending && !query.data) {
    return <PortfolioActivityFallback />
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PortfolioTableFilter
        id="portfolio-activity-filter"
        onChange={setFilter}
        placeholder="Filter activity…"
        value={filter}
      />
      <div className="min-h-0 flex-1 overflow-auto">
        <DataTable
          caption="Account activity"
          className="min-w-full"
          emptyMessage="No recent activity yet."
          getRowHref={(activity) => getAssetHref({ symbol: activity.symbol })}
          table={table}
        />
      </div>
      <DataTablePagination
        canNextPage={Boolean(nextPageToken)}
        canPreviousPage={pages.pageIndex > 0}
        onNextPage={() => {
          if (nextPageToken) {
            pages.goNext(nextPageToken)
          }
        }}
        onPreviousPage={pages.goPrevious}
        pageIndex={pages.pageIndex}
        pageSize={PORTFOLIO_TABLE_PAGE_SIZE}
        rowCount={filteredActivities.length}
      />
    </div>
  )
}
