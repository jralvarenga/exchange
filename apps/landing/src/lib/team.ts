export type Role = 'Admin' | 'Member' | 'Owner' | 'Paper member' | 'Viewer'

export type Member = {
  /** Placeholder profile photo; the initials show if it fails to load. */
  image: string
  initials: string
  name: string
  role: Role
}

export type Workspace = {
  active: boolean
  detail: string
  name: string
}

export type ActivityEntry = {
  /** Symbol for the asset logo; account changes show the member instead. */
  symbol?: string
  initials: string
  time: string
  title: string
}

/** Returns a placeholder profile photo from randomuser.me, such as `women/44`. */
function portrait(path: string): string {
  return `https://randomuser.me/api/portraits/${path}.jpg`
}

/** Returns a member's photo by their initials, for activity entries. */
export function getMemberImage(initials: string): string | undefined {
  return members.find((member) => member.initials === initials)?.image
}

/** Every role, as the app names and describes them. */
export const roles: { description: string; label: Role }[] = [
  {
    description: 'Everything, including deleting the workspace.',
    label: 'Owner',
  },
  {
    description: 'Trades, invites people, manages keys and members.',
    label: 'Admin',
  },
  { description: 'Trades on paper and live connections.', label: 'Member' },
  { description: 'Trades on paper connections only.', label: 'Paper member' },
  { description: 'Sees balances, orders and history.', label: 'Viewer' },
]

export const workspaces: Workspace[] = [
  { active: true, detail: 'Just you · 2 connections', name: 'Personal' },
  { active: false, detail: '4 members · 3 connections', name: 'Ridge Capital' },
]

export const members: Member[] = [
  {
    image: portrait('women/44'),
    initials: 'AR',
    name: 'Ana Ruiz',
    role: 'Owner',
  },
  {
    image: portrait('men/32'),
    initials: 'ML',
    name: 'Marco Lee',
    role: 'Admin',
  },
  {
    image: portrait('men/75'),
    initials: 'SP',
    name: 'Sam Patel',
    role: 'Paper member',
  },
  {
    image: portrait('women/68'),
    initials: 'JK',
    name: 'Jo Kim',
    role: 'Viewer',
  },
]

export const activity: ActivityEntry[] = [
  {
    initials: 'AR',
    symbol: 'NVDA',
    time: '10:42',
    title: 'Ana bought 12 NVDA',
  },
  {
    initials: 'SP',
    symbol: 'SPY',
    time: '10:15',
    title: 'Sam placed a paper limit on SPY',
  },
  { initials: 'ML', time: '09:58', title: 'Marco invited Jo as a viewer' },
]
