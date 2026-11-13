import { NavbarBackdrop } from '@/components/navbar-backdrop'
import { NavbarSearch } from '@/components/navbar-search'
import { TicketTrigger } from '@/components/order-ticket/ticket-trigger'
import { UserNav } from '@/components/user-nav'
import type { ShellUser, ShellWorkspace } from '@/lib/navigation'

interface Props {
  user: ShellUser
  workspace: ShellWorkspace
}

/** Floats the search input and user nav over the page, leaving the rest of it clickable. */
export function Navbar({ user, workspace }: Props) {
  return (
    <>
      <NavbarBackdrop />
      <header className="pointer-events-none fixed inset-x-4 top-3 z-40 flex h-16 items-center justify-between gap-2 sm:inset-x-6">
        <search className="pointer-events-auto min-w-0 flex-1 sm:max-w-80">
          <NavbarSearch />
        </search>
        <div className="pointer-events-auto flex items-center gap-2">
          <TicketTrigger />

          <div className="shrink-0">
            <UserNav user={user} workspace={workspace} />
          </div>
        </div>
      </header>
    </>
  )
}
