'use client'

import { cn } from '@workspace/ui/lib/utils'

import { TopPositionRow } from '@/components/home/top-position-row'
import { PortfolioPositionsEmpty } from '@/components/portfolio/portfolio-positions-empty'
import { usePortfolio } from '@/hooks/use-portfolio'
import type { PositionClassFilter } from '@/lib/portfolio/position-filter'
import { filterTopPositions } from '@/lib/portfolio/position-filter'
import { matchesSymbolQuery } from '@/lib/portfolio/symbol-query'
import { revealClassName } from '@/lib/utils'

interface Props {
  filter: PositionClassFilter
  query: string
}

/** Lists every holding that matches the filters, largest first, with its share of the portfolio. */
export function PortfolioPositionsList({ filter, query }: Props) {
  const { data } = usePortfolio()
  const totalValue = data.positions.reduce(
    (total, position) => total + Math.abs(position.marketValue),
    0
  )
  const positions = filterTopPositions({
    filter,
    limit: data.positions.length,
    positions: data.positions,
  }).filter((position) =>
    matchesSymbolQuery({ query, values: [position.symbol] })
  )

  if (positions.length === 0) {
    return (
      <PortfolioPositionsEmpty
        reason={
          data.positions.length === 0
            ? 'none'
            : query.trim()
              ? 'search'
              : 'filter'
        }
      />
    )
  }

  return (
    <ul className={cn('flex flex-col', revealClassName)}>
      {positions.map((position) => (
        <TopPositionRow
          allocation={
            totalValue === 0 ? 0 : Math.abs(position.marketValue) / totalValue
          }
          key={position.assetId}
          position={position}
        />
      ))}
    </ul>
  )
}
