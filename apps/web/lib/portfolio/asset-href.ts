interface GetAssetHrefOptions {
  assetId?: string
  symbol?: string
}

/** Returns the asset detail route for an id or symbol when one is available. */
export function getAssetHref(options: GetAssetHrefOptions): string | undefined {
  if (options.assetId) {
    return `/assets/${encodeURIComponent(options.assetId)}`
  }

  if (options.symbol) {
    return `/assets/${encodeURIComponent(options.symbol)}`
  }

  return undefined
}
