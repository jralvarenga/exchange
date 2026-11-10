import type { NextConfig } from 'next'

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
        destination: '/account?section=keys',
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
}

export default nextConfig
