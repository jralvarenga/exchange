import { StatsStripFallback } from '@/components/stats-strip-fallback'

const stats = [
  { label: 'Buying power', width: 'w-48' },
  { label: 'Cash', width: 'w-40' },
  { label: 'Today', width: 'w-44' },
]

/** Mirrors the stats strip while values load. */
export function BalancesFallback() {
  return <StatsStripFallback stats={stats} loadingLabel="Loading balances" />
}
