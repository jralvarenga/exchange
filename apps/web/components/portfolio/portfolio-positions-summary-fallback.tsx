import { StatsStripFallback } from '@/components/stats-strip-fallback'

const stats = [
  { label: 'Market value', width: 'w-44' },
  { label: 'Cost basis', width: 'w-40' },
  { label: 'Unrealized return', width: 'w-48' },
]

/** Mirrors the stats strip while values load. */
export function PortfolioPositionsSummaryFallback() {
  return (
    <StatsStripFallback
      stats={stats}
      loadingLabel="Loading positions summary"
    />
  )
}
