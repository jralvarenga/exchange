import type { PortfolioPosition } from '@/lib/alpaca/schemas'

export type PositionClassFilter = 'all' | 'crypto' | 'us_equity'

interface FilterTopPositionsOptions {
  filter: PositionClassFilter
  limit?: number
  positions: PortfolioPosition[]
}

/** Keeps positions of one asset class and returns the largest by value. */
export function filterTopPositions(
  options: FilterTopPositionsOptions
): PortfolioPosition[] {
  return options.positions
    .filter(
      (position) =>
        options.filter === 'all' || position.assetClass === options.filter
    )
    .sort(
      (left, right) => Math.abs(right.marketValue) - Math.abs(left.marketValue)
    )
    .slice(0, options.limit ?? 6)
}
