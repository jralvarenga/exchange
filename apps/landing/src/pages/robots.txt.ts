import type { APIRoute } from 'astro'

/**
 * Serves robots.txt. The whole landing site is public, so every crawler may
 * index it, and the sitemap URL follows the configured `site`.
 */
export const GET: APIRoute = function getRobots({ site }) {
  const sitemap = new URL('/sitemap-index.xml', site).toString()
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${sitemap}`,
    '',
  ].join('\n')

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
