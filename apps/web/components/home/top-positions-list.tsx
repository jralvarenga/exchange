'use client'

import { cn } from '@workspace/ui/lib/utils'

import { TopPositionRow } from '@/components/home/top-position-row'
import { TopPositionsEmpty } from '@/components/home/top-positions-empty'
import { usePortfolio } from '@/hooks/use-portfolio'
import type { PositionClassFilter } from '@/lib/portfolio/position-filter'
import { filterTopPositions } from '@/lib/portfolio/position-filter'
import { revealClassName } from '@/lib/utils'

interface Props {
  filter: PositionClassFilter
}

/** Lists the largest holdings for the selected asset class. */
export function TopPositionsList({ filter }: Props) {
  const { data } = usePortfolio()
  const totalValue = data.positions.reduce(
    (total, position) => total + Math.abs(position.marketValue),
    0
  )
  const positions = filterTopPositions({ filter, positions: data.positions })

  if (positions.length === 0) {
    return <TopPositionsEmpty filtered={data.positions.length > 0} />
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
