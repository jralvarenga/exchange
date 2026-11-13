'use client'

import { PillGroup, type PillOption } from '@/components/pill-group'
import type { AssetInterval } from '@/lib/alpaca/schemas'
import type { AssetChartType } from '@/lib/asset-chart'

interface Props {
  chartType: AssetChartType
  interval: AssetInterval
  onChartTypeChange: (chartType: AssetChartType) => void
  onIntervalChange: (interval: AssetInterval) => void
}

const chartTypeOptions: PillOption<AssetChartType>[] = [
  { label: 'Line', value: 'line' },
  { label: 'Candles', value: 'candlestick' },
]

const intervalOptions: PillOption<AssetInterval>[] = [
  { label: '1D', value: '1D' },
  { label: '1W', value: '1W' },
  { label: '1M', value: '1M' },
  { label: '3M', value: '3M' },
  { label: '1Y', value: '1Y' },
]

/** Lets traders choose the asset chart representation and time horizon. */
export function AssetChartControls({
  chartType,
  interval,
  onChartTypeChange,
  onIntervalChange,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <PillGroup
        label="Price range"
        onChange={onIntervalChange}
        options={intervalOptions}
        value={interval}
      />
      <PillGroup
        label="Chart type"
        onChange={onChartTypeChange}
        options={chartTypeOptions}
        value={chartType}
      />
    </div>
  )
}
