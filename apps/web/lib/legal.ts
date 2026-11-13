/** The Astro dev server, which serves the legal pages locally. */
const defaultLandingUrl = 'http://127.0.0.1:4321'

/** Absolute URLs of the legal pages on the landing site. */
export type LegalLinks = {
  privacy: string
  terms: string
}

/**
 * Builds the Terms of service and Privacy policy URLs on the landing site.
 * Reads `NEXT_PUBLIC_LANDING_URL`, inlined at build time, and falls back to
 * the local Astro dev server when it is blank or unset.
 */
export function getLegalLinks(
  landingUrl: string | undefined = process.env.NEXT_PUBLIC_LANDING_URL
): LegalLinks {
  const origin = landingUrl?.trim() || defaultLandingUrl

  return {
    privacy: new URL('/privacy', origin).toString(),
    terms: new URL('/terms', origin).toString(),
  }
}
