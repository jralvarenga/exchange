import type { MetadataRoute } from 'next'

import { siteMeta } from '@/lib/site'

/** Describes the installed app: name, start page, colors and icons. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: siteMeta.themeColor.dark,
    description: siteMeta.description,
    display: 'standalone',
    icons: [
      { sizes: 'any', src: '/icon.svg', type: 'image/svg+xml' },
      { sizes: '192x192', src: '/icons/icon-192.png', type: 'image/png' },
      { sizes: '512x512', src: '/icons/icon-512.png', type: 'image/png' },
      {
        purpose: 'maskable',
        sizes: '512x512',
        src: '/icons/icon-maskable-512.png',
        type: 'image/png',
      },
    ],
    id: '/',
    name: siteMeta.name,
    scope: '/',
    short_name: siteMeta.name,
    start_url: '/',
    theme_color: siteMeta.themeColor.dark,
  }
}
