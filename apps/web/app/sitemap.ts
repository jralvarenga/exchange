import type { MetadataRoute } from 'next'

import { getAppUrl } from '@/lib/site'

/** Lists the only public pages of the app: login and sign-up. */
export default function sitemap(): MetadataRoute.Sitemap {
  const appUrl = getAppUrl()

  return ['/login', '/sign-up'].map((path) => ({
    changeFrequency: 'yearly',
    priority: path === '/login' ? 1 : 0.8,
    url: new URL(path, appUrl).toString(),
  }))
}
