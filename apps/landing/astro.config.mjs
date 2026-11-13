// @ts-check
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, envField, fontProviders } from 'astro/config'

// https://astro.build/config
export default defineConfig({
  env: {
    schema: {
      PUBLIC_APP_URL: envField.string({
        access: 'public',
        context: 'client',
        default: 'http://localhost:3000',
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
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    // The shared UI package ships TypeScript source, so Vite must bundle it.
    ssr: {
      noExternal: ['@workspace/ui'],
    },
  },
})
