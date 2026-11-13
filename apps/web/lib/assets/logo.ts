import type { AssetSearchResult } from '@/lib/alpaca/schemas'

interface AssetLogoOptions {
  assetClass: AssetSearchResult['assetClass']
  symbol: string
}

/** Returns the symbol a logo is filed under, dropping the quote currency from crypto pairs. */
export function getAssetLogoSymbol(options: AssetLogoOptions): string {
  const [primarySymbol = options.symbol, quote] = options.symbol.split('/')

  // Only a compact pair like `BTCUSD` carries its quote currency as a suffix.
  return options.assetClass === 'crypto' && quote === undefined
    ? primarySymbol.replace(/(?:USDC|USDT|USD)$/u, '') || primarySymbol
    : primarySymbol
}

/** Returns the remote logo URL for a stock or crypto asset. */
export function getAssetLogoUrl(options: AssetLogoOptions): string {
  const logoType = options.assetClass === 'crypto' ? 'crypto' : 'symbol'

  return `https://assets.parqet.com/logos/${logoType}/${encodeURIComponent(getAssetLogoSymbol(options))}?format=png&size=64`
}
