'use client'

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@workspace/ui/components/chart'
import { cn } from '@workspace/ui/lib/utils'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts'

import { AssetChartEmpty } from '@/components/asset-detail/asset-chart-empty'
import { AssetChartZoom } from '@/components/asset-detail/asset-chart-zoom'
import { CandlestickShape } from '@/components/asset-detail/candlestick-shape'
import {
  formatAssetPrice,
  formatChartTimestamp,
} from '@/components/asset-detail/utils'
import { useAssetChartViewport } from '@/hooks/use-asset-chart-viewport'
import type {
  AssetBar,
  AssetHistory,
  AssetInterval,
} from '@/lib/alpaca/schemas'
import type { AssetChartType } from '@/lib/asset-chart'
import {
  WHEEL_ZOOM_IN_FACTOR,
  WHEEL_ZOOM_OUT_FACTOR,
} from '@/lib/asset-chart-viewport'

interface Props {
  chartType: AssetChartType
  currency: string
  history: AssetHistory
  interval: AssetInterval
  price: number
}

interface ChartPoint extends AssetBar {
  range: [number, number]
}

interface PriceDomainOptions {
  bars: AssetBar[]
  price: number
}

interface DragState {
  pointerId: number
  startRangeStart: number
  startX: number
}

const chartConfig = {
  close: {
    color: 'var(--primary)',
    label: 'Close',
  },
  range: {
    color: 'var(--foreground)',
    label: 'OHLC',
  },
} satisfies ChartConfig

const tooltipDateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

/** Displays responsive line or candlestick history for one asset. */
export function AssetChart({
  chartType,
  currency,
  history,
  interval,
  price,
}: Props) {
  const chartData: ChartPoint[] = history.bars.map((bar) => ({
    ...bar,
    range: [bar.low, bar.high],
  }))
  const viewport = useAssetChartViewport({
    interval,
    length: chartData.length,
    symbol: history.symbol,
  })
  const chartRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const zoomByRef = useRef(viewport.zoomBy)
  const [isDragging, setIsDragging] = useState(false)
  zoomByRef.current = viewport.zoomBy

  useEffect(() => {
    const chartNode = chartRef.current

    if (!chartNode) {
      return
    }

    /** Zooms around the pointer without scrolling the page. */
    function handleWheel(event: WheelEvent): void {
      const target = chartRef.current

      if (!target) {
        return
      }

      event.preventDefault()

      const rect = target.getBoundingClientRect()
      const focusRatio =
        rect.width === 0
          ? 1
          : Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))

      if (event.deltaY < 0) {
        zoomByRef.current(WHEEL_ZOOM_IN_FACTOR, focusRatio)
        return
      }

      zoomByRef.current(WHEEL_ZOOM_OUT_FACTOR, focusRatio)
    }

    chartNode.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      chartNode.removeEventListener('wheel', handleWheel)
    }
  }, [])

  if (history.bars.length === 0) {
    return <AssetChartEmpty interval={interval} />
  }

  const visibleData = chartData.slice(
    viewport.range.startIndex,
    viewport.range.endIndex + 1
  )
  const priceDomain = getPriceDomain({ bars: visibleData, price })
  const latestBar = history.bars.at(-1)
  const canPan = viewport.canPanLeft || viewport.canPanRight

  /** Starts a drag-to-pan gesture on the visible window. */
  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>): void {
    if (event.button !== 0 || !canPan) {
      return
    }

    dragRef.current = {
      pointerId: event.pointerId,
      startRangeStart: viewport.range.startIndex,
      startX: event.clientX,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    setIsDragging(true)
  }

  /** Pans the window as the pointer moves after a drag starts. */
  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>): void {
    const drag = dragRef.current
    const width = chartRef.current?.clientWidth ?? 0

    if (!drag || event.pointerId !== drag.pointerId || width === 0) {
      return
    }

    const barsMoved = Math.round(
      ((event.clientX - drag.startX) / width) * viewport.visibleCount
    )

    viewport.panTo(drag.startRangeStart - barsMoved)
  }

  /** Ends the drag-to-pan gesture. */
  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>): void {
    if (dragRef.current?.pointerId !== event.pointerId) {
      return
    }

    dragRef.current = null
    setIsDragging(false)
  }

  return (
    <div className="flex h-full min-h-[24rem] flex-col">
      <p className="sr-only" id="asset-chart-summary">
        {history.symbol} {interval} price chart. Latest close{' '}
        {latestBar
          ? formatAssetPrice({ currency, value: latestBar.close })
          : 'unavailable'}
        . Scroll over the chart to zoom around the pointer. Drag the chart to
        move through time.
      </p>
      <AssetChartZoom
        canPanLeft={viewport.canPanLeft}
        canPanRight={viewport.canPanRight}
        canReset={viewport.canReset}
        canZoomIn={viewport.canZoomIn}
        canZoomOut={viewport.canZoomOut}
        onPanLeft={viewport.panLeft}
        onPanRight={viewport.panRight}
        onReset={viewport.reset}
        onZoomIn={() => viewport.zoomIn()}
        onZoomOut={() => viewport.zoomOut()}
        totalCount={chartData.length}
        visibleCount={viewport.visibleCount}
      />
      <div
        className={cn(
          'min-h-80 flex-1',
          canPan && (isDragging ? 'cursor-grabbing' : 'cursor-grab')
        )}
        onPointerCancel={handlePointerUp}
        onPointerDown={handlePointerDown}
        onLostPointerCapture={handlePointerUp}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        ref={chartRef}
      >
        <ChartContainer
          aria-describedby="asset-chart-summary"
          aria-label={`${history.symbol} ${interval} ${chartType} chart`}
          className="[&_.recharts-responsive-container]:!size-full aspect-auto h-full min-h-80 w-full touch-none justify-stretch"
          config={chartConfig}
          role="img"
        >
          <ComposedChart
            accessibilityLayer
            data={visibleData}
            margin={{ bottom: 4, left: 0, right: 8, top: 12 }}
          >
            <CartesianGrid
              stroke="var(--border)"
              strokeDasharray="3 5"
              vertical={false}
            />
            <XAxis
              axisLine={false}
              dataKey="timestamp"
              minTickGap={36}
              tickFormatter={(timestamp: string) =>
                formatChartTimestamp({ interval, timestamp })
              }
              tickLine={false}
              tickMargin={12}
            />
            <YAxis
              axisLine={false}
              domain={priceDomain}
              orientation="right"
              tickFormatter={(value: number) =>
                formatAssetPrice({ currency, value })
              }
              tickLine={false}
              tickMargin={8}
              width={82}
            />
            <ChartTooltip
              active={isDragging ? false : undefined}
              content={
                <ChartTooltipContent
                  formatter={(_value, _name, item) => {
                    const bar = item.payload as ChartPoint | undefined

                    if (!bar) {
                      return null
                    }

                    if (chartType === 'line') {
                      return (
                        <div className="flex w-full items-center justify-between gap-4">
                          <span className="text-muted-foreground">Close</span>
                          <span className="font-medium font-mono tabular-nums">
                            {formatAssetPrice({ currency, value: bar.close })}
                          </span>
                        </div>
                      )
                    }

                    return (
                      <dl className="grid w-full grid-cols-[auto_auto] gap-x-4 gap-y-1">
                        <dt className="text-muted-foreground">Open</dt>
                        <dd className="text-right font-mono tabular-nums">
                          {formatAssetPrice({ currency, value: bar.open })}
                        </dd>
                        <dt className="text-muted-foreground">High</dt>
                        <dd className="text-right font-mono tabular-nums">
                          {formatAssetPrice({ currency, value: bar.high })}
                        </dd>
                        <dt className="text-muted-foreground">Low</dt>
                        <dd className="text-right font-mono tabular-nums">
                          {formatAssetPrice({ currency, value: bar.low })}
                        </dd>
                        <dt className="text-muted-foreground">Close</dt>
                        <dd className="text-right font-medium font-mono tabular-nums">
                          {formatAssetPrice({ currency, value: bar.close })}
                        </dd>
                      </dl>
                    )
                  }}
                  hideIndicator
                  labelFormatter={(_label, payload) => {
                    const timestamp = payload[0]?.payload?.timestamp

                    return typeof timestamp === 'string'
                      ? tooltipDateFormatter.format(new Date(timestamp))
                      : 'Time unavailable'
                  }}
                />
              }
              cursor={
                isDragging
                  ? false
                  : {
                      stroke: 'var(--muted-foreground)',
                      strokeDasharray: '3 4',
                    }
              }
            />
            <ReferenceLine
              ifOverflow="extendDomain"
              label={{
                fill: 'var(--foreground)',
                fontSize: 12,
                position: 'insideTopRight',
                value: formatAssetPrice({ currency, value: price }),
              }}
              stroke="var(--primary)"
              strokeDasharray="4 4"
              y={price}
            />
            {chartType === 'line' ? (
              <Line
                dataKey="close"
                dot={false}
                isAnimationActive={false}
                stroke="var(--color-close)"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.25}
                type="monotone"
              />
            ) : (
              <Bar
                dataKey="range"
                isAnimationActive={false}
                maxBarSize={16}
                shape={CandlestickShape}
              />
            )}
          </ComposedChart>
        </ChartContainer>
      </div>
    </div>
  )
}

/** Pads the visible OHLC range without exaggerating flat price movement. */
function getPriceDomain(options: PriceDomainOptions): [number, number] {
  const lows = options.bars.map((bar) => bar.low)
  const highs = options.bars.map((bar) => bar.high)
  const minimum = Math.min(...lows, options.price)
  const maximum = Math.max(...highs, options.price)
  const span = maximum - minimum
  const padding = span === 0 ? Math.max(maximum * 0.005, 0.01) : span * 0.08

  return [minimum - padding, maximum + padding]
}
