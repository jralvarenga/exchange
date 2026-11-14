export const accountSections = [
  { label: 'Balances', value: 'balances' },
  { label: 'Limits', value: 'limits' },
  { label: 'Trading', value: 'trading' },
  { label: 'Connections', value: 'connections' },
  { label: 'Workspace', value: 'workspace' },
  { label: 'History', value: 'history' },
  { label: 'Funding', value: 'funding' },
  { label: 'Appearance', value: 'appearance' },
] as const

export type AccountSectionId = (typeof accountSections)[number]['value']

export const defaultAccountSection: AccountSectionId = 'balances'

const accountSectionIds = new Set<string>(
  accountSections.map((section) => section.value)
)

/** Returns whether a value is a tab on the account page. */
export function isAccountSectionId(value: unknown): value is AccountSectionId {
  return typeof value === 'string' && accountSectionIds.has(value)
}

/** Builds the account URL that opens a tab, leaving the default tab bare. */
export function getAccountSectionHref(section: AccountSectionId): string {
  return section === defaultAccountSection
    ? '/account'
    : `/account?section=${section}`
}
