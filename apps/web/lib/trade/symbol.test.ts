import { describe, expect, test } from 'bun:test'

import { getAssetHref } from '@/lib/portfolio/asset-href'
import {
  decodeTradeSymbol,
  getNewsSymbol,
  getTradeHref,
  getTradeTitle,
} from '@/lib/trade/symbol'

describe('trade symbols', () => {
  test('encodes a crypto pair into one route segment', () => {
    expect(getTradeHref('BTC/USD')).toBe('/trade/BTC%2FUSD')
    expect(getTradeHref('AAPL')).toBe('/trade/AAPL')
  })

  test('decodes encoded and already decoded segments', () => {
    expect(decodeTradeSymbol('BTC%2FUSD')).toBe('BTC/USD')
    expect(decodeTradeSymbol('BTC/USD')).toBe('BTC/USD')
    expect(decodeTradeSymbol('%E0%A4%A')).toBe('%E0%A4%A')
  })

  test('titles the tab with the ticker, or Trade for an asset id', () => {
    expect(getTradeTitle('aapl')).toBe('AAPL · Trade')
    expect(getTradeTitle('BTC/USD')).toBe('BTC/USD · Trade')
    expect(getTradeTitle('b0b6dd9d-8b9b-48a9-ba46-b9d54906e415')).toBe('Trade')
  })

  test('drops the slash for news symbols', () => {
    expect(getNewsSymbol('ETH/USD')).toBe('ETHUSD')
    expect(getNewsSymbol('MSFT')).toBe('MSFT')
  })

  test('links assets to the Trade screen, preferring the symbol', () => {
    expect(getAssetHref({ assetId: 'abc', symbol: 'BTC/USD' })).toBe(
      '/trade/BTC%2FUSD'
    )
    expect(getAssetHref({ assetId: 'abc' })).toBe('/trade/abc')
    expect(getAssetHref({})).toBeUndefined()
  })
})
