import type { WorkspaceRole } from '@workspace/db/queries/workspaces'
import type { LucideIcon } from 'lucide-react'
import { CircleUser, House, Wallet } from 'lucide-react'

export type NavItem = {
  href: string
  icon: LucideIcon
  title: string
}

export type ShellUser = {
  email: string
  image: string | null
  name: string
}

/** A connection as the shell shows it: no key material. */
export type ShellConnection = {
  environment: 'live' | 'paper'
  id: string
  name: string
  status: 'invalid' | 'unverified' | 'valid'
}

/** The active workspace, its connections and the other workspaces to switch to. */
export type ShellWorkspace = {
  /** The connection this member trades with: their pick, else the default. */
  activeConnectionId: string | null
  connections: ShellConnection[]
  defaultConnectionId: string | null
  id: string
  name: string
  role: WorkspaceRole
  workspaces: { id: string; name: string }[]
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
