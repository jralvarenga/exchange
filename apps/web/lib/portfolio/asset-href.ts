import { getTradeHref } from '@/lib/trade/symbol'

interface GetAssetHrefOptions {
  assetId?: string
  symbol?: string
}

/** Returns the Trade screen for a symbol, or an asset id when no symbol is known. */
export function getAssetHref(options: GetAssetHrefOptions): string | undefined {
  const identifier = options.symbol || options.assetId

  return identifier ? getTradeHref(identifier) : undefined
}
