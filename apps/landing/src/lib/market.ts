import { createSeries } from '@/lib/utils'

/** Theme token a chart line is drawn in. */
export type Tone = 'foreground' | 'market-down' | 'market-up'

export type LogoSize = 'lg' | 'md' | 'row' | 'sm'

/**
 * A stock or ETF logo floating in a token field. `left` and `top` run from 0
 * to 100 and always keep the whole logo inside the field.
 */
export type FloatingToken = {
  /** How strongly it follows the pointer; far logos move less. */
  depth: number
  /** Hidden on phones, where only the near logos fit. */
  desktopOnly?: boolean
  left: number
  size: Exclude<LogoSize, 'row'>
  symbol: string
  top: number
}

export type Ticker = {
  change: number
  name: string
  price: number
  series: number[]
  shares: number
  symbol: string
}

export type Position = {
  allocation: number
  price: number
  quantity: number
  return: number
  symbol: string
}

export type Order = {
  amount: number
  detail: string
  status: 'filled' | 'open'
  symbol: string
}

/** Big names up front, ETFs from different issuers further back. */
export const heroTokens: FloatingToken[] = [
  { depth: 28, left: 4, size: 'lg', symbol: 'NVDA', top: 4 },
  { depth: 16, left: 50, size: 'md', symbol: 'SPY', top: 0 },
  { depth: 24, left: 96, size: 'lg', symbol: 'TSLA', top: 8 },
  { depth: 20, left: 6, size: 'md', symbol: 'META', top: 96 },
  { depth: 18, left: 94, size: 'md', symbol: 'QQQ', top: 92 },
  {
    depth: 8,
    desktopOnly: true,
    left: 0,
    size: 'sm',
    symbol: 'GOOGL',
    top: 50,
  },
  {
    depth: 10,
    desktopOnly: true,
    left: 100,
    size: 'sm',
    symbol: 'VOO',
    top: 54,
  },
  {
    depth: 6,
    desktopOnly: true,
    left: 50,
    size: 'sm',
    symbol: 'ARKK',
    top: 100,
  },
  {
    depth: 6,
    desktopOnly: true,
    left: 28,
    size: 'sm',
    symbol: 'AAPL',
    top: 16,
  },
  {
    depth: 12,
    desktopOnly: true,
    left: 74,
    size: 'sm',
    symbol: 'IWM',
    top: 18,
  },
]

export const ctaTokens: FloatingToken[] = [
  { depth: 18, left: 4, size: 'md', symbol: 'AMZN', top: 10 },
  { depth: 8, left: 14, size: 'sm', symbol: 'SCHD', top: 90 },
  { depth: 24, left: 96, size: 'lg', symbol: 'MSFT', top: 0 },
  { depth: 10, left: 86, size: 'sm', symbol: 'VOO', top: 96 },
]

export const heroTickers: Ticker[] = [
  {
    change: 0.0312,
    name: 'NVIDIA',
    price: 182.64,
    series: createSeries({
      drift: 0.002,
      length: 40,
      seed: 7,
      start: 172,
      volatility: 0.01,
    }),
    shares: 40,
    symbol: 'NVDA',
  },
  {
    change: 0.0087,
    name: 'SPDR S&P 500',
    price: 612.4,
    series: createSeries({
      drift: 0.0009,
      length: 40,
      seed: 21,
      start: 598,
      volatility: 0.006,
    }),
    shares: 12,
    symbol: 'SPY',
  },
]

/** A year of balance history for the product preview's full-bleed chart. */
export const balanceSeries = createSeries({
  drift: 0.0016,
  length: 90,
  seed: 44,
  start: 41_200,
  volatility: 0.009,
})

export const balance = {
  buyingPower: 18_420.5,
  cash: 9_210.25,
  change: 0.0241,
  value: 48_210.32,
}

export const positions: Position[] = [
  {
    allocation: 0.31,
    price: 612.4,
    quantity: 24,
    return: 0.1842,
    symbol: 'SPY',
  },
  {
    allocation: 0.22,
    price: 182.64,
    quantity: 58,
    return: 0.4215,
    symbol: 'NVDA',
  },
  {
    allocation: 0.14,
    price: 301.88,
    quantity: 22,
    return: -0.0432,
    symbol: 'TSLA',
  },
]

export const orders: Order[] = [
  {
    amount: 1_224.8,
    detail: 'Buy · Limit · 10:42',
    status: 'open',
    symbol: 'META',
  },
  {
    amount: 3_062,
    detail: 'Buy · Market · 09:31',
    status: 'filled',
    symbol: 'QQQ',
  },
  {
    amount: 1_076.24,
    detail: 'Sell · Market · Yesterday',
    status: 'filled',
    symbol: 'AAPL',
  },
]
