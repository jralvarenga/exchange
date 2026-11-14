// @ts-check
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, envField, fontProviders } from 'astro/config'
import { loadEnv } from 'vite'

/** The hosted landing site, used when `PUBLIC_SITE_URL` is unset or invalid. */
const defaultSiteUrl = 'https://treid.app'

/**
 * Resolves the public origin that canonical URLs, Open Graph tags and the
 * sitemap are built from. `astro:env` is not available inside the config, so
 * the value is read with Vite's `loadEnv`, which also reads `.env` files.
 * @param {string | undefined} value The raw `PUBLIC_SITE_URL` value.
 * @returns {string} The origin, without a trailing slash.
 */
function resolveSiteUrl(value) {
  try {
    return new URL(value?.trim() || defaultSiteUrl).origin
  } catch {
    return defaultSiteUrl
  }
}

const { PUBLIC_SITE_URL } = loadEnv(
  process.env.NODE_ENV ?? 'production',
  process.cwd(),
  'PUBLIC_'
)

// https://astro.build/config
export default defineConfig({
  site: resolveSiteUrl(PUBLIC_SITE_URL),
  // Matches the links in `lib/links.ts`, so canonical URLs and the sitemap
  // name the same address people and crawlers follow.
  trailingSlash: 'never',
  env: {
    schema: {
      PUBLIC_APP_URL: envField.string({
        access: 'public',
        context: 'client',
        default: 'http://localhost:3000',
        url: true,
      }),
      // Read in this config through `loadEnv` to set `site`. Declared here so
      // it stays typed and validated like the other variables.
      PUBLIC_SITE_URL: envField.string({
        access: 'public',
        context: 'client',
        default: defaultSiteUrl,
        url: true,
      }),
      PUBLIC_SUPPORT_EMAIL: envField.string({
        access: 'public',
        context: 'client',
        default: 'support@example.com',
      }),
    },
  },
  fonts: [
    {
      cssVariable: '--font-sans',
      name: 'Geist',
      provider: fontProviders.google(),
    },
    {
      cssVariable: '--font-mono',
      name: 'Geist Mono',
      provider: fontProviders.google(),
    },
  ],
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
    // The shared UI package ships TypeScript source, so Vite must bundle it.
    ssr: {
      noExternal: ['@workspace/ui'],
    },
  },
})
