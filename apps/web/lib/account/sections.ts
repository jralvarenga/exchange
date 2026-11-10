export const accountSections = [
  { id: 'balances', label: 'Balances' },
  { id: 'limits', label: 'Limits' },
  { id: 'trading', label: 'Trading' },
  { id: 'keys', label: 'Keys' },
  { id: 'funding', label: 'Funding' },
  { id: 'appearance', label: 'Appearance' },
] as const

export type AccountSectionId = (typeof accountSections)[number]['id']

const accountSectionIds = new Set<string>(
  accountSections.map((section) => section.id)
)

/** Returns whether a value is a section id on the account page. */
export function isAccountSectionId(value: string): value is AccountSectionId {
  return accountSectionIds.has(value)
}
