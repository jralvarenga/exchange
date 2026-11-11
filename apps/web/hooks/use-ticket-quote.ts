import { useMarketSnapshot } from '@/hooks/use-market-snapshot'
import { useOptionSnapshot } from '@/hooks/use-option-snapshot'
import type { MarketSnapshot } from '@/lib/alpaca/market-schemas'
import type { TicketAsset } from '@/models/order-ticket/ticket'

interface TicketQuote {
  data?: Pick<
    MarketSnapshot,
    'askPrice' | 'bidPrice' | 'lastPrice' | 'updatedAt'
  >
  isError: boolean
  isFetching: boolean
}

/**
 * Reads a stock, crypto, or option quote. Options use the contract symbol
 * directly, so an adjusted root is never mistaken for the underlying.
 */
export function useTicketQuote(asset: TicketAsset | null): TicketQuote {
  const option = asset?.assetClass === 'us_option'
  const stock = useMarketSnapshot(option ? '' : (asset?.symbol ?? ''))
  const contract = useOptionSnapshot(option ? asset.symbol : '')
  return option ? contract : stock
}
