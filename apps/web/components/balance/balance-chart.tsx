'use client'

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@workspace/ui/components/chart'
import { type CSSProperties, useId } from 'react'
import { Area, AreaChart, YAxis } from 'recharts'

import { BalanceChartEmpty } from '@/components/balance/balance-chart-empty'
import { useBalanceHistory } from '@/hooks/use-balance-history'
import type {
  BalanceChart as BalanceHistory,
  BalanceInterval,
} from '@/lib/alpaca/schemas'

interface Props {
  interval: BalanceInterval
}

interface ChartPoint {
  equity: number
  timestamp: string
}

interface EquityDomainOptions {
  equities: number[]
}

interface LastPointDotProps {
  cx?: number
  cy?: number
  index?: number
}

interface ChartLineColorOptions {
  firstEquity: number
  lastEquity: number
}

const balanceFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  style: 'currency',
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

/** Fades the full-bleed chart into the page at both horizontal edges. */
const edgeFade =
  'linear-gradient(to right, transparent, black 8%, black 92%, transparent)'

/** Drops incomplete history points so the chart only plots known equity. */
function toChartPoints(points: BalanceHistory['points']): ChartPoint[] {
  return points.flatMap((point) =>
    point.equity === null
      ? []
      : [{ equity: point.equity, timestamp: point.timestamp }]
  )
}

/** Picks the equity line color from the period's direction. */
function getChartLineColor(options: ChartLineColorOptions): string {
  if (options.lastEquity > options.firstEquity) {
    return 'var(--market-up)'
  }

  if (options.lastEquity < options.firstEquity) {
    return 'var(--market-down)'
  }

  return 'var(--foreground)'
}

/** Pads the equity domain so the line floats above a deep gradient. */
function getEquityDomain(options: EquityDomainOptions): [number, number] {
  const minimumEquity = Math.min(...options.equities)
  const maximumEquity = Math.max(...options.equities)
  const equityRange = maximumEquity - minimumEquity
  const range =
    equityRange === 0 ? Math.max(maximumEquity * 0.001, 1) : equityRange

  return [minimumEquity - range * 0.45, maximumEquity + range * 0.12]
}

/** Displays a full-bleed equity line whose gradient melts into the page. */
export function BalanceChart({ interval }: Props) {
  const rawId = useId()
  const gradientId = `balance-fill-${rawId.replace(/:/g, '')}`
  const { data: history } = useBalanceHistory({ interval })
  const chartData = toChartPoints(history.points)

  if (chartData.length === 0) {
    return <BalanceChartEmpty interval={interval} />
  }

  const firstEquity = chartData[0]?.equity ?? 0
  const lastEquity = chartData.at(-1)?.equity ?? 0
  const lastIndex = chartData.length - 1
  const chartConfig = {
    equity: {
      color: getChartLineColor({ firstEquity, lastEquity }),
      label: 'Balance',
    },
  } satisfies ChartConfig
  const equityDomain = getEquityDomain({
    equities: chartData.map((point) => point.equity),
  })

  /** Marks the latest point with a live pulse; other points stay bare. */
  function renderLastPointDot({ cx, cy, index }: LastPointDotProps) {
    if (index !== lastIndex || cx === undefined || cy === undefined) {
      return <g key={`dot-${index}`} />
    }

    return (
      <g key="dot-last">
        <circle
          className="origin-center animate-ping [transform-box:fill-box] motion-reduce:hidden"
          cx={cx}
          cy={cy}
          fill="var(--color-equity)"
          opacity={0.4}
          r={8}
        />
        <circle
          cx={cx}
          cy={cy}
          fill="var(--color-equity)"
          r={4}
          stroke="var(--background)"
          strokeWidth={2}
        />
      </g>
    )
  }

  return (
    <ChartContainer
      aria-label={`Balance history for ${interval}`}
      className="[&_.recharts-responsive-container]:!size-full fade-in aspect-auto size-full animate-in justify-stretch blur-in-sm duration-1000 ease-out motion-reduce:animate-none [&_.recharts-surface]:[-webkit-mask-image:var(--balance-chart-edge-fade)] [&_.recharts-surface]:[mask-image:var(--balance-chart-edge-fade)]"
      config={chartConfig}
      style={
        {
          '--balance-chart-edge-fade': edgeFade,
        } as CSSProperties
      }
    >
      <AreaChart
        accessibilityLayer
        data={chartData}
        margin={{ bottom: 0, left: 0, right: 12, top: 12 }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-equity)"
              stopOpacity={0.32}
            />
            <stop
              offset="55%"
              stopColor="var(--color-equity)"
              stopOpacity={0.08}
            />
            <stop offset="100%" stopColor="var(--background)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis dataKey="equity" domain={equityDomain} hide width={0} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => (
                <span className="font-medium text-foreground tabular-nums">
                  {balanceFormatter.format(Number(value))}
                </span>
              )}
              hideIndicator
              labelFormatter={(_label, payload) => {
                const timestamp = payload[0]?.payload?.timestamp

                return typeof timestamp === 'string'
                  ? dateFormatter.format(new Date(timestamp))
                  : 'Date unavailable'
              }}
            />
          }
          cursor={{ stroke: 'var(--border)', strokeDasharray: '4 4' }}
        />
        <Area
          activeDot={{
            fill: 'var(--color-equity)',
            r: 5,
            stroke: 'var(--background)',
            strokeWidth: 2,
          }}
          animationDuration={900}
          baseValue={equityDomain[0]}
          dataKey="equity"
          dot={renderLastPointDot}
          fill={`url(#${gradientId})`}
          fillOpacity={1}
          stroke="var(--color-equity)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          type="monotone"
        />
      </AreaChart>
    </ChartContainer>
  )
}
