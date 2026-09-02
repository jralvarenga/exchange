import { Dices } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { BuyDialog } from '@/components/buy/buy-dialog'

interface Props {
  search: ReactNode
}

/** Displays the logo, market search, and account purchase action. */
export function Navbar({ search }: Props) {
  return (
    <header className="flex h-20 shrink-0 items-center gap-3 px-4 sm:gap-4 sm:px-6 md:h-24 md:px-4 md:pr-5">
      <Link
        href="/"
        aria-label="Exchange home"
        className="flex size-12 shrink-0 items-center justify-center rounded-full text-primary outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring md:hidden"
      >
        <Dices aria-hidden="true" className="size-7" strokeWidth={2.5} />
      </Link>
      <search className="min-w-0 flex-1 sm:max-w-80">{search}</search>
      <BuyDialog />
    </header>
  )
}
