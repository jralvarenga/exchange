export const portfolioTabs = [
  { label: 'Positions', value: 'positions' },
  { label: 'Orders', value: 'orders' },
  { label: 'Activity', value: 'activity' },
  { label: 'Balances', value: 'balances' },
  { label: 'Documents', value: 'documents' },
] as const

export type PortfolioTab = (typeof portfolioTabs)[number]['value']

export const defaultPortfolioTab: PortfolioTab = 'positions'

const portfolioTabValues = new Set<string>(
  portfolioTabs.map((tab) => tab.value)
)

/** Returns whether a value names one of the portfolio tabs. */
export function isPortfolioTab(value: unknown): value is PortfolioTab {
  return typeof value === 'string' && portfolioTabValues.has(value)
}

/** Builds the portfolio URL that opens a tab, leaving the default tab bare. */
export function getPortfolioTabHref(tab: PortfolioTab): string {
  return tab === defaultPortfolioTab ? '/portfolio' : `/portfolio?tab=${tab}`
}
