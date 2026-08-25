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
  transpilePackages: ['@workspace/ui'],
}

export default nextConfig
