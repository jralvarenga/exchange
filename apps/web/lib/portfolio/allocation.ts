import type { PortfolioPosition } from '@/lib/alpaca/schemas'

export const MAXIMUM_LEGEND_SLICES = 3

const sliceColors = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

export type AllocationSlice = {
  color: string
  key: string
  label: string
  percent: number
  value: number
}

export type Allocation = {
  holdingCount: number
  slices: AllocationSlice[]
  totalValue: number
}

/** Builds one donut slice per open position, ranked by market value. */
export function getAllocation(positions: PortfolioPosition[]): Allocation {
  const ranked = positions
    .map((position) => ({ position, value: Math.abs(position.marketValue) }))
    .filter((entry) => entry.value > 0)
    .sort((left, right) => right.value - left.value)
  const totalValue = ranked.reduce((total, entry) => total + entry.value, 0)

  if (totalValue === 0) {
    return { holdingCount: 0, slices: [], totalValue: 0 }
  }

  return {
    holdingCount: ranked.length,
    slices: ranked.map((entry, index) => ({
      color: sliceColors[index % sliceColors.length] ?? 'var(--chart-1)',
      key: entry.position.assetId,
      label: entry.position.symbol,
      percent: (entry.value / totalValue) * 100,
      value: entry.value,
    })),
    totalValue,
  }
}

/** Returns the three largest holdings for the list beside the donut. */
export function getLegendSlices(allocation: Allocation): AllocationSlice[] {
  return allocation.slices.slice(0, MAXIMUM_LEGEND_SLICES)
}
