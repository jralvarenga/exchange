import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

/** Lays out a tab's filters: pills on the left, search on the right from `sm`. */
export function PortfolioToolbar({ children }: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {children}
    </div>
  )
}
