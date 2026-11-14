import { describe, expect, test } from 'bun:test'

import type { PortfolioPosition } from '@/lib/alpaca/schemas'
import { getPositionsSummary } from '@/lib/portfolio/summary'

/** Builds a position with an overrideable value, cost and return. */
function position(
  overrides: Partial<PortfolioPosition> &
    Pick<PortfolioPosition, 'costBasis' | 'marketValue' | 'symbol'>
): PortfolioPosition {
  return {
    assetClass: 'us_equity',
    assetId: overrides.symbol,
    averageEntryPrice: 10,
    changeTodayPercent: 0,
    currentPrice: 10,
    quantity: 1,
    side: 'long',
    unrealizedProfitLoss: overrides.marketValue - overrides.costBasis,
    unrealizedProfitLossPercent: 0,
    ...overrides,
  }
}

describe('getPositionsSummary', () => {
  test('totals value, cost and return in percent of cost', () => {
    const summary = getPositionsSummary([
      position({ costBasis: 100, marketValue: 150, symbol: 'AAPL' }),
      position({ costBasis: 300, marketValue: 250, symbol: 'NFLX' }),
    ])

    expect(summary).toEqual({
      costBasis: 400,
      marketValue: 400,
      positionCount: 2,
      unrealizedProfitLoss: 0,
      unrealizedProfitLossPercent: 0,
    })
  })

  test('reports a gain against the total cost basis', () => {
    const summary = getPositionsSummary([
      position({ costBasis: 200, marketValue: 250, symbol: 'AAPL' }),
    ])

    expect(summary.unrealizedProfitLossPercent).toBe(25)
  })

  test('returns zeros when nothing is held', () => {
    expect(getPositionsSummary([]).unrealizedProfitLossPercent).toBe(0)
  })
})
