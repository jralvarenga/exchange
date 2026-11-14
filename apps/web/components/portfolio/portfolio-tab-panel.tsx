import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

/** Spaces a tab's content below the tab list with the page's section rhythm. */
export function PortfolioTabPanel({ children }: Props) {
  return <div className="flex flex-col gap-6 py-8 md:py-10">{children}</div>
}
