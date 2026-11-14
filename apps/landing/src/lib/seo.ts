import { externalLinks } from '@/lib/links'
import { PUBLIC_APP_URL } from 'astro:env/client'

/** One JSON-LD node, serialized into a `application/ld+json` script. */
export type JsonLd = Record<string, unknown>

/** Defaults every page starts from. Pages override title and description. */
export const siteMeta = {
  description:
    'A quiet trading desk for your Alpaca account. Trade stocks, ETFs, options and crypto on paper or live, on your own or in a workspace with your team.',
  image: {
    alt: 'The treid. wordmark in white on near-black, above the line "A quiet trading desk for your Alpaca account."',
    height: 630,
    path: '/og-image.png',
    type: 'image/png',
    width: 1200,
  },
  locale: 'en_US',
  name: 'Treid',
  /** Browser UI colors that match the page background in each theme. */
  themeColor: { dark: '#0c0a09', light: '#ffffff' },
  title: 'Treid · Trade on Alpaca without the noise',
}

interface StructuredDataOptions {
  /** The site origin from `Astro.site`. */
  site: URL
}

/**
 * Builds the JSON-LD graph that describes the company and the site. Every
 * page includes it so search engines can tie the pages to one entity.
 */
export function siteStructuredData({ site }: StructuredDataOptions): JsonLd {
  const url = new URL('/', site).toString()

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@id': `${url}#organization`,
        '@type': 'Organization',
        logo: {
          '@type': 'ImageObject',
          height: 512,
          url: new URL('/icon-512.png', site).toString(),
          width: 512,
        },
        name: siteMeta.name,
        sameAs: [externalLinks.github],
        url,
      },
      {
        '@id': `${url}#website`,
        '@type': 'WebSite',
        description: siteMeta.description,
        inLanguage: 'en',
        name: siteMeta.name,
        publisher: { '@id': `${url}#organization` },
        url,
      },
    ],
  }
}

/**
 * Describes the Treid web app itself, for the home page. It lists no price
 * because the site does not publish one.
 */
export function appStructuredData({ site }: StructuredDataOptions): JsonLd {
  const url = new URL('/', site).toString()
  const appUrl = new URL('/', PUBLIC_APP_URL)
  // The schema default points at the local dev server. Leave it out rather
  // than advertise localhost to search engines when it is not configured.
  const isLocalApp = ['localhost', '127.0.0.1', '[::1]'].includes(
    appUrl.hostname
  )

  return {
    '@context': 'https://schema.org',
    '@id': `${url}#app`,
    '@type': 'WebApplication',
    applicationCategory: 'FinanceApplication',
    browserRequirements: 'Requires JavaScript and an Alpaca account.',
    description: siteMeta.description,
    image: new URL(siteMeta.image.path, site).toString(),
    name: siteMeta.name,
    operatingSystem: 'Any',
    publisher: { '@id': `${url}#organization` },
    ...(isLocalApp ? {} : { url: appUrl.toString() }),
  }
}

/**
 * Serializes JSON-LD for an inline script. Escapes `<` so a value can never
 * close the script tag early.
 */
export function serializeJsonLd(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
