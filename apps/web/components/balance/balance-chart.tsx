'use client'

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@workspace/ui/components/chart'
import { useId } from 'react'
import { Area, AreaChart, Line, YAxis } from 'recharts'

import { useBalanceHistory } from '@/hooks/use-balance-history'
import type { BalanceInterval } from '@/lib/alpaca/schemas'

interface Props {
  interval: BalanceInterval
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

/** Displays an axis-free, full-width line of historical account equity. */
export function BalanceChart({ interval }: Props) {
  const { data: history } = useBalanceHistory({ interval })
  const chartData = history.points.flatMap((point) =>
    point.equity === null
      ? []
      : [{ equity: point.equity, timestamp: point.timestamp }]
  )
  const gradientId = `balance-fill-${useId().replace(/:/g, '')}`

  if (chartData.length === 0) {
    return (
      <div className="h-48 w-full" role="status">
        <span className="sr-only">
          Balance history is unavailable for {interval}.
        </span>
      </div>
    )
  }

  const equities = chartData.map((point) => point.equity)
  const minimumEquity = Math.min(...equities)
  const maximumEquity = Math.max(...equities)
  const equityRange = maximumEquity - minimumEquity
  const domainPadding =
    equityRange === 0 ? Math.max(maximumEquity * 0.001, 1) : equityRange * 0.12
  const equityDomain: [number, number] = [
    minimumEquity - domainPadding,
    maximumEquity + domainPadding,
  ]

  return (
    <ChartContainer
      aria-label={`Balance history for ${interval}`}
      className="aspect-auto h-48 w-full"
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
        <defs>
          <Line id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-equity)"
              stopOpacity={0.28}
            />
            <stop
              offset="95%"
              stopColor="var(--color-equity)"
              stopOpacity={0}
            />
          </Line>
        </defs>
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
