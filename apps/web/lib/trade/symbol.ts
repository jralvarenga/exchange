/** Symbol the bare Trade route opens when no asset is chosen. */
export const defaultTradeSymbol = 'AAPL'

/**
 * Returns the Trade screen path for a symbol or asset id. Crypto pairs such as
 * `BTC/USD` are encoded so the slash stays inside one route segment.
 */
export function getTradeHref(identifier: string): string {
  return `/trade/${encodeURIComponent(identifier.trim())}`
}

/** Reads a Trade route segment back into the symbol or asset id it encodes. */
export function decodeTradeSymbol(segment: string): string {
  try {
    return decodeURIComponent(segment).trim()
  } catch {
    return segment.trim()
  }
}

/** Returns the symbol Alpaca news uses, which drops the slash from crypto pairs. */
export function getNewsSymbol(symbol: string): string {
  return symbol.replace('/', '')
}
