import { PUBLIC_APP_URL, PUBLIC_SUPPORT_EMAIL } from 'astro:env/client'

export type SectionLink = {
  href: string
  title: string
}

/** Entry points into the web app, which owns sign up and log in. */
export const appLinks = {
  logIn: new URL('/login', PUBLIC_APP_URL).toString(),
  signUp: new URL('/sign-up', PUBLIC_APP_URL).toString(),
}

/** Home page anchors shown in the navbar and footer. Rooted at `/` so they also work from the legal pages. */
export const sectionLinks: SectionLink[] = [
  { href: '/#workspaces', title: 'Workspaces' },
  { href: '/#features', title: 'Features' },
  { href: '/#security', title: 'Security' },
  { href: '/#open-source', title: 'Open source' },
]

export const externalLinks = {
  alpaca: 'https://alpaca.markets',
  /** Alpaca's own sign-up. A new account starts with paper trading. */
  alpacaSignUp: 'https://app.alpaca.markets/signup',
  github: 'https://github.com/jralvarenga/treid',
  issues: 'https://github.com/jralvarenga/treid/issues/new',
  pullRequests: 'https://github.com/jralvarenga/treid/pulls',
  /** The README's setup guide, from secrets to the HTTPS proxy. */
  selfHostGuide: 'https://github.com/jralvarenga/treid#https-deployment',
}

/** Pages for the privacy policy and the terms of service. */
export const legalLinks = {
  privacy: '/privacy',
  terms: '/terms',
}

/** Where people reach a person, set with `PUBLIC_SUPPORT_EMAIL`. */
export const support = {
  email: PUBLIC_SUPPORT_EMAIL,
  href: `mailto:${PUBLIC_SUPPORT_EMAIL}`,
}
