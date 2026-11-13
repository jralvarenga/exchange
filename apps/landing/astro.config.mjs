// @ts-check
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, fontProviders } from 'astro/config'

// https://astro.build/config
export default defineConfig({
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
