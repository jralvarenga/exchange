/**
 * Returns the public origin Better Auth uses for callbacks, emails, and cookies.
 * Preview deploys use the Vercel host so those links stay on that deployment.
 */
export function resolveAuthBaseURL(
  source: Record<string, string | undefined>
): string | undefined {
  if (source.VERCEL_ENV === 'preview' && source.VERCEL_URL) {
    return `https://${source.VERCEL_URL}`
  }

  return source.BETTER_AUTH_URL
}

/**
 * Origins allowed for CSRF checks and OAuth callbacks.
 * Includes the active base URL, the configured production origin, preview
 * hosts, and any extra comma-separated BETTER_AUTH_TRUSTED_ORIGINS values.
 */
export function resolveAuthTrustedOrigins(
  source: Record<string, string | undefined>
): string[] {
  const origins = new Set<string>()
  const baseURL = resolveAuthBaseURL(source)

  if (baseURL) {
    origins.add(baseURL)
  }

  if (source.BETTER_AUTH_URL) {
    origins.add(source.BETTER_AUTH_URL)
  }

  if (source.VERCEL_URL) {
    origins.add(`https://${source.VERCEL_URL}`)
  }

  const extra = source.BETTER_AUTH_TRUSTED_ORIGINS

  if (extra) {
    for (const origin of extra.split(',')) {
      const trimmed = origin.trim()

      if (trimmed.length > 0) {
        origins.add(trimmed)
      }
    }
  }

  return [...origins]
}
