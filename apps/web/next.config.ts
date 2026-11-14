import { fileURLToPath } from 'node:url'
import type { NextConfig } from 'next'

/** The monorepo root, so Turbopack never picks a stray lockfile above it. */
const workspaceRoot = fileURLToPath(new URL('../..', import.meta.url))

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: 'assets.parqet.com',
        pathname: '/logos/**',
        port: '',
        protocol: 'https',
        search: '?format=png&size=64',
      },
    ],
  },
  async redirects() {
    return [
      {
        destination: '/account?section=connections',
        permanent: true,
        source: '/settings',
      },
      {
        destination: '/account?section=funding',
        permanent: true,
        source: '/funds-wallet',
      },
    ]
  },
  serverExternalPackages: ['pg'],
  transpilePackages: ['@workspace/auth', '@workspace/db', '@workspace/ui'],
  turbopack: {
    root: workspaceRoot,
  },
}

export default nextConfig
