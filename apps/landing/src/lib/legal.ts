export type LegalPath = '/privacy' | '/terms'

/**
 * ISO date each legal page's text last changed, keyed by its path. The page
 * shows it as "Last updated" and the sitemap sends it as `<lastmod>`, so
 * Google only sees a new date when the text really changed. Bump the date in
 * the same commit that edits the page.
 */
export const legalUpdated: Record<LegalPath, string> = {
  '/privacy': '2026-11-13',
  '/terms': '2026-11-13',
}
