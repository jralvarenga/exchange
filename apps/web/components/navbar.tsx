import { Button } from '@workspace/ui/components/button'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@workspace/ui/components/input-group'
import { Search, ShoppingBasket } from 'lucide-react'

import { UserNav } from '@/components/user-nav'
import type { ShellUser } from '@/lib/navigation'

interface Props {
  user: ShellUser
}

/** Floats the search input and user nav over the page, leaving the rest of it clickable. */
export function Navbar({ user }: Props) {
  return (
    <header className="pointer-events-none fixed inset-x-4 top-3 z-40 flex h-16 items-center justify-between gap-2 sm:inset-x-6">
      <search className="pointer-events-auto min-w-0 flex-1 sm:max-w-80">
        <InputGroup>
          <InputGroupInput aria-label="Search" placeholder="Search…" />
          <InputGroupAddon>
            <Search aria-hidden="true" />
          </InputGroupAddon>
        </InputGroup>
      </search>
      <div className="pointer-events-auto flex items-center gap-2">
        <Button>
          <ShoppingBasket />
          Buy / Sell
        </Button>

        <div className="shrink-0">
          <UserNav user={user} />
        </div>
      </div>
    </header>
  )
}
