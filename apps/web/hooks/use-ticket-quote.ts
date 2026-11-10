import { useMarketSnapshot } from '@/hooks/use-market-snapshot'
import { useOptionChain } from '@/hooks/use-option-chain'
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

/** Reads stock/crypto quotes or the selected OCC contract from its option chain. */
export function useTicketQuote(asset: TicketAsset | null): TicketQuote {
  const option = asset?.assetClass === 'us_option'
  const contract = option
    ? asset.symbol.match(/^(.+?)(\d{2})(\d{2})(\d{2})[CP]\d{8}$/u)
    : null
  const snapshot = useMarketSnapshot(option ? '' : (asset?.symbol ?? ''))
  const chain = useOptionChain({
    enabled: Boolean(contract),
    underlying: contract?.[1] ?? '',
    expiration: contract
      ? `20${contract[2]}-${contract[3]}-${contract[4]}`
      : undefined,
  })
  if (!option) return snapshot
  return {
    data: [...(chain.data?.calls ?? []), ...(chain.data?.puts ?? [])].find(
      (candidate) => candidate.symbol === asset.symbol
    ),
    isError: chain.isError,
    isFetching: chain.isFetching,
  }
}
