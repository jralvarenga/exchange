/** The local Next dev server, used when no public origin is configured. */
const defaultAppUrl = 'http://localhost:3000'

/** Process-env-shaped input for {@link getAppUrl}. */
export type AppUrlSource = {
  NEXT_PUBLIC_APP_URL?: string
  PORT?: string
  VERCEL_URL?: string
}

/** Names and copy shared by the root metadata, the manifest and link previews. */
export const siteMeta = {
  description:
    'A quiet trading desk for your Alpaca account. Trade on paper or live, on your own or in a workspace with your team.',
  name: 'Treid',
  /** Page background in each theme, so browser chrome blends into the app. */
  themeColor: { dark: '#0c0a09', light: '#ffffff' },
}

/** Returns the origin of a URL, or undefined when the value is blank or invalid. */
function toOrigin(value: string | undefined): string | undefined {
  const trimmed = value?.trim()

  if (!trimmed) {
    return undefined
  }

  try {
    return new URL(trimmed).origin
  } catch {
    return undefined
  }
}

/**
 * Resolves the public origin of the web app for absolute metadata URLs such
 * as Open Graph images, canonical links, robots.txt and the sitemap. Reads
 * `NEXT_PUBLIC_APP_URL` first, then the Vercel deployment host, then the
 * local dev server. An invalid value falls through instead of failing.
 */
export function getAppUrl(source: AppUrlSource = process.env): URL {
  const origin =
    toOrigin(source.NEXT_PUBLIC_APP_URL) ??
    toOrigin(source.VERCEL_URL ? `https://${source.VERCEL_URL}` : undefined) ??
    (source.PORT ? `http://localhost:${source.PORT}` : defaultAppUrl)

  return new URL(origin)
}
