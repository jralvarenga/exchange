import Link from 'next/link'

import { Logo } from '@/components/logo'
import { NavbarBackdrop } from '@/components/navbar-backdrop'
import { NavbarSearch } from '@/components/navbar-search'
import { TicketTrigger } from '@/components/order-ticket/ticket-trigger'
import { UserNav } from '@/components/user-nav'
import type { ShellUser, ShellWorkspace } from '@/lib/navigation'

interface Props {
  user: ShellUser
  workspace: ShellWorkspace
}

/** Floats the logo, search input and user nav over the page, leaving the rest of it clickable. */
export function Navbar({ user, workspace }: Props) {
  return (
    <>
      <NavbarBackdrop />
      <header className="pointer-events-none fixed inset-x-4 top-3 z-40 flex h-16 items-center justify-between gap-2 sm:inset-x-6">
        <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-6">
          <Link
            aria-label="Treid home"
            className="pointer-events-auto shrink-0 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            href="/"
          >
            <Logo />
          </Link>
          <search className="pointer-events-auto min-w-0 flex-1 sm:max-w-80">
            <NavbarSearch />
          </search>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="hidden md:block">
            <TicketTrigger />
          </div>

          <div className="shrink-0">
            <UserNav user={user} workspace={workspace} />
          </div>
        </div>
      </header>
    </>
  )
}
