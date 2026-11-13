import type { LucideIcon } from 'lucide-react'
import { CircleUser, House, Wallet } from 'lucide-react'

export type NavItem = {
  href: string
  icon: LucideIcon
  title: string
}

export type ShellUser = {
  email: string
  name: string
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
    href: '/account',
    icon: CircleUser,
    title: 'Account',
  },
]

interface IsNavItemActiveParams {
  href: string
  pathname: string
}

/** Returns whether a pathname is the Trade screen, which shows the ticket inline. */
export function isTradePath(pathname: string): boolean {
  return pathname === '/trade' || pathname.startsWith('/trade/')
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
