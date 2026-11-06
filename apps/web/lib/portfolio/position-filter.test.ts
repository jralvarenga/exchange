import { describe, expect, test } from 'bun:test'

import type { PortfolioPosition } from '@/lib/alpaca/schemas'
import { filterTopPositions } from '@/lib/portfolio/position-filter'

/** Builds a position with an overrideable class, value, and identity. */
function position(
  overrides: Partial<PortfolioPosition> &
    Pick<PortfolioPosition, 'assetId' | 'marketValue' | 'symbol'>
): PortfolioPosition {
  return {
    assetClass: 'us_equity',
    averageEntryPrice: 10,
    changeTodayPercent: 0,
    costBasis: Math.abs(overrides.marketValue),
    currentPrice: 10,
    quantity: 1,
    side: overrides.marketValue < 0 ? 'short' : 'long',
    unrealizedProfitLoss: 0,
    unrealizedProfitLossPercent: 0,
    ...overrides,
  }
}

describe('filterTopPositions', () => {
  const holdings = [
    position({ assetId: 'aapl', marketValue: 400, symbol: 'AAPL' }),
    position({
      assetClass: 'crypto',
      assetId: 'btc',
      marketValue: 900,
      symbol: 'BTCUSD',
    }),
    position({ assetId: 'nflx', marketValue: -700, symbol: 'NFLX' }),
    position({
      assetClass: 'us_option',
      assetId: 'opt',
      marketValue: 200,
      symbol: 'AAPL260117C00200000',
    }),
  ]

  test('keeps one asset class when a filter is selected', () => {
    expect(
      filterTopPositions({ filter: 'crypto', positions: holdings }).map(
        (holding) => holding.symbol
      )
    ).toEqual(['BTCUSD'])
    expect(
      filterTopPositions({ filter: 'us_equity', positions: holdings }).map(
        (holding) => holding.symbol
      )
    ).toEqual(['NFLX', 'AAPL'])
  })

  test('ranks by absolute market value', () => {
    expect(
      filterTopPositions({ filter: 'all', positions: holdings }).map(
        (holding) => holding.symbol
      )
    ).toEqual(['BTCUSD', 'NFLX', 'AAPL', 'AAPL260117C00200000'])
  })

  test('keeps the six largest positions by default', () => {
    const crowded = Array.from({ length: 8 }, (_, index) =>
      position({
        assetId: `asset-${index}`,
        marketValue: index + 1,
        symbol: `S${index}`,
      })
    )

    expect(
      filterTopPositions({ filter: 'all', positions: crowded })
    ).toHaveLength(6)
    expect(
      filterTopPositions({ filter: 'all', limit: 3, positions: crowded })
    ).toHaveLength(3)
  })
})
