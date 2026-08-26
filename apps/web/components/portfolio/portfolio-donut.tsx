'use client'

import {
  type ChartConfig,
  ChartContainer,
} from '@workspace/ui/components/chart'
import { Cell, Pie, PieChart } from 'recharts'

import type { Allocation } from '@/lib/portfolio/allocation'
import { formatCurrency } from '@/lib/utils'

interface Props {
  activeKey: string | null
  allocation: Allocation
  onHoverKeyChange: (key: string | null) => void
}

/** Shows every holding as a donut slice and reads out the active weight. */
export function PortfolioDonut({
  activeKey,
  allocation,
  onHoverKeyChange,
}: Props) {
  const activeSlice = allocation.slices.find((slice) => slice.key === activeKey)
  const chartConfig: ChartConfig = Object.fromEntries(
    allocation.slices.map((slice) => [
      slice.key,
      { color: slice.color, label: slice.label },
    ])
  )

  return (
    <div className="relative mx-auto aspect-square w-full max-w-56">
      <ChartContainer
        aria-hidden="true"
        className="aspect-square h-full w-full"
        config={chartConfig}
      >
        <PieChart margin={{ bottom: 0, left: 0, right: 0, top: 0 }}>
          <Pie
            cornerRadius={8}
            data={allocation.slices}
            dataKey="value"
            innerRadius="74%"
            isAnimationActive
            nameKey="label"
            onMouseEnter={(_slice, index) =>
              onHoverKeyChange(allocation.slices[index]?.key ?? null)
            }
            onMouseLeave={() => onHoverKeyChange(null)}
            outerRadius="100%"
            paddingAngle={allocation.slices.length > 1 ? 3 : 0}
            stroke="none"
          >
            {allocation.slices.map((slice) => (
              <Cell
                className="[transition:fill-opacity_150ms_ease-out] motion-reduce:transition-none"
                fill={slice.color}
                fillOpacity={
                  activeKey === null || activeKey === slice.key ? 1 : 0.25
                }
                key={slice.key}
              />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5 px-10 text-center"
      >
        <span className="max-w-full truncate font-bold text-muted-foreground">
          {activeSlice ? activeSlice.label : 'Market value'}
        </span>
        <span className="max-w-full truncate font-bold font-mono text-2xl tabular-nums">
          {formatCurrency(
            activeSlice ? activeSlice.value : allocation.totalValue
          )}
        </span>
      </div>
    </div>
  )
}
