/** The Astro dev server, which serves the legal pages locally. */
const defaultLandingUrl = 'http://127.0.0.1:4321'

/** Absolute URLs of the legal pages on the landing site. */
export type LegalLinks = {
  privacy: string
  terms: string
}

/** Returns the landing origin, or the default when the value is not a valid URL. */
function resolveLandingOrigin(landingUrl: string | undefined): string {
  const origin = landingUrl?.trim()

  if (!origin) {
    return defaultLandingUrl
  }

  try {
    return new URL(origin).origin
  } catch {
    return defaultLandingUrl
  }
}

/**
 * Builds the Terms of service and Privacy policy URLs on the landing site.
 * Reads `NEXT_PUBLIC_LANDING_URL`, inlined at build time, and falls back to
 * the local Astro dev server when it is blank, unset or not a valid URL, so a
 * bad value never breaks the auth pages.
 */
export function getLegalLinks(
  landingUrl: string | undefined = process.env.NEXT_PUBLIC_LANDING_URL
): LegalLinks {
  const origin = resolveLandingOrigin(landingUrl)

  return {
    privacy: new URL('/privacy', origin).toString(),
    terms: new URL('/terms', origin).toString(),
  }
}
