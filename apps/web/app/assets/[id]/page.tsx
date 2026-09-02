'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import { useEffect, useState } from 'react'

import { AssetChart } from '@/components/asset-detail/asset-chart'
import { AssetChartControls } from '@/components/asset-detail/asset-chart-controls'
import { AssetChartError } from '@/components/asset-detail/asset-chart-error'
import { AssetChartFallback } from '@/components/asset-detail/asset-chart-fallback'
import { AssetDetailError } from '@/components/asset-detail/asset-detail-error'
import { AssetDetailFallback } from '@/components/asset-detail/asset-detail-fallback'
import { AssetHeader } from '@/components/asset-detail/asset-header'
import { AssetPosition } from '@/components/asset-detail/asset-position'
import { useAssetDetail } from '@/hooks/use-asset-detail'
import { useAssetHistory } from '@/hooks/use-asset-history'
import { AssetDataError } from '@/lib/alpaca/errors'
import type { AssetInterval } from '@/lib/alpaca/schemas'
import { type AssetChartType, assetChartTypeSchema } from '@/lib/asset-chart'
import { useParams } from 'next/navigation'

const chartTypeStorageKey = 'exchange:asset-chart-type'

/** Coordinates the selected asset summary, position, chart, and preferences. */
export default function AssetDetail() {
  const { id } = useParams<{ id: string }>()
  const [chartType, setChartType] = useState<AssetChartType>('line')
  const [interval, setInterval] = useState<AssetInterval>('1D')
  const detail = useAssetDetail(id)
  const history = useAssetHistory({ identifier: id, interval })

  useEffect(() => {
    try {
      const storedChartType = assetChartTypeSchema.safeParse(
        window.localStorage.getItem(chartTypeStorageKey)
      )

      if (storedChartType.success) {
        setChartType(storedChartType.data)
      }
    } catch {
      // The line chart remains the safe default when storage is unavailable.
    }
  }, [])

  /** Updates and persists the chart representation preference. */
  function handleChartTypeChange(nextChartType: AssetChartType): void {
    setChartType(nextChartType)

    try {
      window.localStorage.setItem(chartTypeStorageKey, nextChartType)
    } catch {
      // The active choice still works for this visit without persistence.
    }
  }

  if (detail.isPending) {
    return <AssetDetailFallback />
  }

  if (detail.isError) {
    const isNotFound =
      detail.error instanceof AssetDataError && detail.error.status === 404

    return (
      <AssetDetailError
        message={detail.error.message}
        onRetry={isNotFound ? undefined : () => void detail.refetch()}
        title={isNotFound ? 'Asset not found' : undefined}
      />
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-1">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className="min-h-64 justify-center">
          <CardContent>
            <AssetHeader detail={detail.data} />
          </CardContent>
        </Card>
        <AssetPosition
          currency={detail.data.currency}
          position={detail.data.position}
        />
      </div>

      <Card className="min-h-[28rem] flex-1">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Price history</CardTitle>
            <p
              aria-live="polite"
              className="mt-1 min-h-5 text-muted-foreground text-sm"
            >
              {history.isFetching && !history.isPending
                ? 'Updating chart…'
                : `${interval} market range`}
            </p>
          </div>
          <AssetChartControls
            chartType={chartType}
            interval={interval}
            onChartTypeChange={handleChartTypeChange}
            onIntervalChange={setInterval}
          />
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col">
          {history.isPending ? <AssetChartFallback /> : null}
          {history.isError ? (
            <AssetChartError onRetry={() => void history.refetch()} />
          ) : history.data ? (
            <div
              className={
                history.isFetching
                  ? 'min-h-0 flex-1 opacity-70 transition-opacity'
                  : 'min-h-0 flex-1 transition-opacity'
              }
            >
              <AssetChart
                chartType={chartType}
                currency={detail.data.currency}
                history={history.data}
                interval={history.data.interval}
                key={`${history.data.symbol}:${history.data.interval}`}
                price={detail.data.price}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
