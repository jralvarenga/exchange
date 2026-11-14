import type { MetadataRoute } from 'next'

import { getAppUrl } from '@/lib/site'

/**
 * Lets crawlers reach only the sign-in entry points and the static assets
 * they need to render them. Everything else needs a session, and invitation,
 * reset and verification links carry tokens.
 */
export default function robots(): MetadataRoute.Robots {
  const appUrl = getAppUrl()

  return {
    rules: {
      allow: [
        '/login',
        '/sign-up',
        '/_next/static/',
        '/_next/image',
        '/icons/',
        '/icon',
        '/apple-icon',
        '/favicon.ico',
        '/manifest.webmanifest',
        '/opengraph-image',
        '/twitter-image',
      ],
      disallow: '/',
      userAgent: '*',
    },
    sitemap: new URL('/sitemap.xml', appUrl).toString(),
  }
}
