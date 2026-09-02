'use client'

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@workspace/ui/components/chart'
import { useId } from 'react'
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

const chartConfig = {
  equity: {
    color: 'var(--primary-foreground)',
    label: 'Balance',
  },
} satisfies ChartConfig

const balanceFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  style: 'currency',
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

/** Drops incomplete history points so the chart only plots known equity. */
function toChartPoints(points: BalanceHistory['points']): ChartPoint[] {
  return points.flatMap((point) =>
    point.equity === null
      ? []
      : [{ equity: point.equity, timestamp: point.timestamp }]
  )
}

/** Pads the equity domain so the line does not hug the chart edges. */
function getEquityDomain(options: EquityDomainOptions): [number, number] {
  const minimumEquity = Math.min(...options.equities)
  const maximumEquity = Math.max(...options.equities)
  const equityRange = maximumEquity - minimumEquity
  const domainPadding =
    equityRange === 0 ? Math.max(maximumEquity * 0.001, 1) : equityRange * 0.12

  return [minimumEquity - domainPadding, maximumEquity + domainPadding]
}

/** Displays an axis-free, full-width line of historical account equity. */
export function BalanceChart({ interval }: Props) {
  const rawId = useId()
  const gradientId = `balance-fill-${rawId.replace(/:/g, '')}`
  const { data: history } = useBalanceHistory({ interval })
  const chartData = toChartPoints(history.points)

  if (chartData.length === 0) {
    return <BalanceChartEmpty interval={interval} />
  }

  const equityDomain = getEquityDomain({
    equities: chartData.map((point) => point.equity),
  })

  return (
    <ChartContainer
      aria-label={`Balance history for ${interval}`}
      className="[&_.recharts-responsive-container]:!size-full aspect-auto h-full min-h-48 w-full justify-stretch"
      config={chartConfig}
    >
      <AreaChart
        accessibilityLayer
        data={chartData}
        margin={{ bottom: 0, left: 0, right: 0, top: 0 }}
      >
        <YAxis dataKey="equity" domain={equityDomain} hide width={0} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => (
                <div className="flex w-full items-center justify-between gap-3">
                  <span className="text-muted-foreground">Balance</span>
                  <span className="font-medium font-mono text-foreground tabular-nums">
                    {balanceFormatter.format(Number(value))}
                  </span>
                </div>
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
          cursor={false}
        />
        <Area
          baseValue={equityDomain[0]}
          dataKey="equity"
          fill={`url(#${gradientId})`}
          fillOpacity={1}
          stroke="var(--color-equity)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          type="monotone"
        />
      </AreaChart>
    </ChartContainer>
  )
}
