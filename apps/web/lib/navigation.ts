import type { LucideIcon } from 'lucide-react'
import { ArrowDownToLine, House, PiggyBank, Wallet } from 'lucide-react'

export type NavItem = {
  href: string
  icon: LucideIcon
  title: string
}

export const navItems: NavItem[] = [
  {
    href: '/',
    icon: House,
    title: 'Home',
  },
  {
    href: '/portfolio',
    icon: Wallet,
    title: 'Portfolio',
  },
  {
    href: '/funds-wallet',
    icon: PiggyBank,
    title: 'Funds & Wallet',
  },
]

interface IsNavItemActiveParams {
  href: string
  pathname: string
}

/** Returns the active asset identifier from an asset detail pathname. */
export function getActiveAssetIdentifier(pathname: string): string | undefined {
  const prefix = '/assets/'

  if (!pathname.startsWith(prefix)) {
    return undefined
  }

  const encodedIdentifier = pathname.slice(prefix.length)

  if (!encodedIdentifier) {
    return undefined
  }

  try {
    return decodeURIComponent(encodedIdentifier)
  } catch {
    return encodedIdentifier
  }
}

/**
 * Returns whether a nav href matches the current pathname.
 */
export function isNavItemActive({
  href,
  pathname,
}: IsNavItemActiveParams): boolean {
  if (href === '/') {
    return pathname === '/'
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}
