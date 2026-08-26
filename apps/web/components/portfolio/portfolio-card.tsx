'use client'

import { cn } from '@workspace/ui/lib/utils'
import { useMemo, useState } from 'react'

import { PortfolioDonut } from '@/components/portfolio/portfolio-donut'
import { PortfolioLegend } from '@/components/portfolio/portfolio-legend'
import { usePortfolio } from '@/hooks/use-portfolio'
import { getAllocation } from '@/lib/portfolio/allocation'
import { formatSignedCurrency, formatSignedPercent } from '@/lib/utils'
import { PieChart } from 'lucide-react'

/** Suspends on holdings, then shows a donut of every asset beside the top three. */
export function PortfolioCard() {
  const { data: portfolio } = usePortfolio()
  const allocation = useMemo(
    () => getAllocation(portfolio.positions),
    [portfolio.positions]
  )
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)
  const [pinnedKey, setPinnedKey] = useState<string | null>(null)
  const activeKey = hoveredKey ?? pinnedKey
  const isGain = portfolio.totalUnrealizedProfitLoss >= 0
  const profitLossPercent =
    portfolio.totalCostBasis === 0
      ? 0
      : (portfolio.totalUnrealizedProfitLoss /
          Math.abs(portfolio.totalCostBasis)) *
        100

  return (
    <section
      aria-labelledby="portfolio-title"
      className="rounded-3xl bg-card p-5 ring-1 ring-foreground/5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 className="font-bold text-2xl" id="portfolio-title">
          Portfolio
        </h2>
        <p className="flex items-baseline gap-2">
          <span className="text-muted-foreground">Unrealized</span>
          <span
            className={cn(
              'font-bold font-mono tabular-nums',
              isGain ? 'text-success' : 'text-danger'
            )}
          >
            <span className="sr-only">{isGain ? 'Gain' : 'Loss'}: </span>
            {formatSignedCurrency(portfolio.totalUnrealizedProfitLoss)} (
            {formatSignedPercent(profitLossPercent)})
          </span>
        </p>
      </div>
      {allocation.slices.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <PieChart aria-hidden="true" className="size-8 text-muted-foreground" />
          <p className="font-bold">No holdings yet</p>
          <p className="max-w-sm text-muted-foreground">
            Buy your first asset and this chart will show how your portfolio is
            split.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid items-center gap-6 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
          <PortfolioDonut
            activeKey={activeKey}
            allocation={allocation}
            onHoverKeyChange={setHoveredKey}
          />
          <PortfolioLegend
            activeKey={activeKey}
            allocation={allocation}
            onHoverKeyChange={setHoveredKey}
            onPinnedKeyChange={setPinnedKey}
            pinnedKey={pinnedKey}
          />
        </div>
      )}
    </section>
  )
}
