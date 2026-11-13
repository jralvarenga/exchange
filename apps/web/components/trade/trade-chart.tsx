'use client'

import { cn } from '@workspace/ui/lib/utils'
import { useEffect, useState } from 'react'

import { AssetChart } from '@/components/asset-detail/asset-chart'
import { AssetChartControls } from '@/components/asset-detail/asset-chart-controls'
import { AssetChartError } from '@/components/asset-detail/asset-chart-error'
import { AssetChartFallback } from '@/components/asset-detail/asset-chart-fallback'
import { useAssetHistory } from '@/hooks/use-asset-history'
import type { AssetInterval } from '@/lib/alpaca/schemas'
import { type AssetChartType, assetChartTypeSchema } from '@/lib/asset-chart'

interface Props {
  price: number
  symbol: string
}

const chartTypeStorageKey = 'exchange:asset-chart-type'

/** Shows the line or candle price chart with its ranges and a remembered chart type. */
export function TradeChart({ price, symbol }: Props) {
  const [chartType, setChartType] = useState<AssetChartType>('line')
  const [interval, setInterval] = useState<AssetInterval>('1D')
  const history = useAssetHistory({ identifier: symbol, interval })
  // The previous range stays on screen while a new one loads, but never another symbol's.
  const data = history.data?.symbol === symbol ? history.data : undefined

  useEffect(() => {
    try {
      const stored = assetChartTypeSchema.safeParse(
        window.localStorage.getItem(chartTypeStorageKey)
      )

      if (stored.success) {
        setChartType(stored.data)
      }
    } catch {
      // The line chart remains the safe default when storage is unavailable.
    }
  }, [])

  /** Updates and persists the chart representation preference. */
  function handleChartTypeChange(next: AssetChartType): void {
    setChartType(next)

    try {
      window.localStorage.setItem(chartTypeStorageKey, next)
    } catch {
      // The active choice still works for this visit without persistence.
    }
  }

  return (
    <section
      aria-labelledby="trade-chart-title"
      className="flex flex-col gap-4"
    >
      <h2 className="sr-only" id="trade-chart-title">
        Price chart
      </h2>
      <AssetChartControls
        chartType={chartType}
        interval={interval}
        onChartTypeChange={handleChartTypeChange}
        onIntervalChange={setInterval}
      />
      <p aria-live="polite" className="sr-only">
        {history.isFetching ? 'Updating chart' : `${interval} range loaded`}
      </p>
      {history.isError && !data ? (
        <AssetChartError onRetry={() => void history.refetch()} />
      ) : data ? (
        <div
          className={cn(
            'min-h-0 transition-opacity motion-reduce:transition-none',
            history.isFetching && 'opacity-70'
          )}
        >
          <AssetChart
            chartType={chartType}
            currency="USD"
            history={data}
            interval={data.interval}
            key={`${data.symbol}:${data.interval}`}
            price={price}
          />
        </div>
      ) : (
        <AssetChartFallback />
      )}
    </section>
  )
}
