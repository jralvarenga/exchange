import type { Orderbook } from '@/lib/alpaca/market-schemas'

/** Returns the running size total at each level of one book side, best price first. */
export function getCumulativeSizes(levels: Orderbook['bids']): number[] {
  let total = 0

  return levels.map((level) => {
    total += level.size
    return total
  })
}
