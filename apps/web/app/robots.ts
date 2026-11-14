import type { MetadataRoute } from 'next'

import { getAppUrl } from '@/lib/site'

/**
 * Lets crawlers reach only the sign-in entry points. Everything else needs a
 * session, and invitation, reset and verification links carry tokens.
 */
export default function robots(): MetadataRoute.Robots {
  const appUrl = getAppUrl()

  return {
    rules: {
      allow: ['/login', '/sign-up'],
      disallow: '/',
      userAgent: '*',
    },
    sitemap: new URL('/sitemap.xml', appUrl).toString(),
  }
}
