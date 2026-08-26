'use client'

import { cn } from '@workspace/ui/lib/utils'

import { type Allocation, getLegendSlices } from '@/lib/portfolio/allocation'
import { formatCurrency, formatPercent } from '@/lib/utils'

interface Props {
  activeKey: string | null
  allocation: Allocation
  onHoverKeyChange: (key: string | null) => void
  onPinnedKeyChange: (key: string | null) => void
  pinnedKey: string | null
}

/** Lists the three largest holdings and drives the donut readout. */
export function PortfolioLegend({
  activeKey,
  allocation,
  onHoverKeyChange,
  onPinnedKeyChange,
  pinnedKey,
}: Props) {
  const legendSlices = getLegendSlices(allocation)
  const hiddenCount = allocation.holdingCount - legendSlices.length

  return (
    <div className="flex flex-col gap-1">
      <ul className="flex flex-col gap-1">
        {legendSlices.map((slice) => (
          <li key={slice.key}>
            <button
              aria-pressed={pinnedKey === slice.key}
              className={cn(
                'flex w-full flex-col gap-2 rounded-2xl px-3 py-2.5 text-left outline-none transition-colors hover:bg-foreground/5 focus-visible:ring-3 focus-visible:ring-ring',
                activeKey === slice.key && 'bg-foreground/5'
              )}
              onBlur={() => onHoverKeyChange(null)}
              onClick={() =>
                onPinnedKeyChange(pinnedKey === slice.key ? null : slice.key)
              }
              onFocus={() => onHoverKeyChange(slice.key)}
              onMouseEnter={() => onHoverKeyChange(slice.key)}
              onMouseLeave={() => onHoverKeyChange(null)}
              type="button"
            >
              <span className="flex w-full items-baseline gap-3">
                <span
                  aria-hidden="true"
                  className="size-2.5 shrink-0 translate-y-px rounded-full"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="min-w-0 truncate font-bold">
                  {slice.label}
                </span>
                <span className="ml-auto shrink-0 font-mono tabular-nums">
                  {formatCurrency(slice.value)}
                </span>
                <span className="w-16 shrink-0 text-right font-mono text-muted-foreground tabular-nums">
                  {formatPercent(slice.percent)}
                </span>
              </span>
              <span
                aria-hidden="true"
                className="block h-1 w-full overflow-hidden rounded-full bg-foreground/10"
              >
                <span
                  className="block h-full rounded-full"
                  style={{
                    backgroundColor: slice.color,
                    width: `${slice.percent}%`,
                  }}
                />
              </span>
            </button>
          </li>
        ))}
      </ul>
      {hiddenCount > 0 ? (
        <p className="px-3 pt-2 text-muted-foreground">
          {hiddenCount} more {hiddenCount === 1 ? 'holding' : 'holdings'} on the
          chart
        </p>
      ) : null}
    </div>
  )
}
