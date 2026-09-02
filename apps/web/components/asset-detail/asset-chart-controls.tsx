'use client'

import { Button } from '@workspace/ui/components/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import { ChartCandlestick, LineChart } from 'lucide-react'

import type { AssetInterval } from '@/lib/alpaca/schemas'
import { assetIntervalSchema } from '@/lib/alpaca/schemas'
import type { AssetChartType } from '@/lib/asset-chart'

interface Props {
  chartType: AssetChartType
  interval: AssetInterval
  onChartTypeChange: (chartType: AssetChartType) => void
  onIntervalChange: (interval: AssetInterval) => void
}

interface IntervalOption {
  label: string
  value: AssetInterval
}

const intervalOptions: IntervalOption[] = [
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
  /** Applies a validated interval from the shared select. */
  function handleIntervalChange(value: AssetInterval | null): void {
    const parsed = assetIntervalSchema.safeParse(value)

    if (parsed.success) {
      onIntervalChange(parsed.data)
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <fieldset
        aria-label="Chart type"
        className="flex rounded-full bg-muted p-1"
      >
        <Button
          aria-label="Show line chart"
          aria-pressed={chartType === 'line'}
          className="h-11 rounded-full px-4"
          onClick={() => onChartTypeChange('line')}
          type="button"
          variant={chartType === 'line' ? 'default' : 'ghost'}
        >
          <LineChart aria-hidden="true" />
          Line
        </Button>
        <Button
          aria-label="Show candlestick chart"
          aria-pressed={chartType === 'candlestick'}
          className="h-11 rounded-full px-4"
          onClick={() => onChartTypeChange('candlestick')}
          type="button"
          variant={chartType === 'candlestick' ? 'default' : 'ghost'}
        >
          <ChartCandlestick aria-hidden="true" />
          Candles
        </Button>
      </fieldset>

      <Select
        items={intervalOptions}
        onValueChange={handleIntervalChange}
        value={interval}
      >
        <SelectTrigger
          aria-label="Price history interval"
          className="h-11 min-w-24 bg-muted px-4"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {intervalOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
