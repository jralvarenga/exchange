import type { PortfolioPosition } from '@/lib/alpaca/schemas'

export type PositionsSummary = {
  costBasis: number
  marketValue: number
  positionCount: number
  unrealizedProfitLoss: number
  /** Unrealized return in percent of cost basis (5 means 5%), 0 when nothing is held. */
  unrealizedProfitLossPercent: number
}

/** Totals market value, cost basis and unrealized return across positions. */
export function getPositionsSummary(
  positions: PortfolioPosition[]
): PositionsSummary {
  const totals = positions.reduce(
    (summary, position) => ({
      costBasis: summary.costBasis + Math.abs(position.costBasis),
      marketValue: summary.marketValue + position.marketValue,
      unrealizedProfitLoss:
        summary.unrealizedProfitLoss + position.unrealizedProfitLoss,
    }),
    { costBasis: 0, marketValue: 0, unrealizedProfitLoss: 0 }
  )

  return {
    ...totals,
    positionCount: positions.length,
    unrealizedProfitLossPercent:
      totals.costBasis === 0
        ? 0
        : (totals.unrealizedProfitLoss / totals.costBasis) * 100,
  }
}
