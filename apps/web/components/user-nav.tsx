'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'
import { LogOut, Settings } from 'lucide-react'
import Link from 'next/link'

import { useSignOut } from '@/hooks/use-sign-out'
import type { ShellUser } from '@/lib/navigation'
import { getInitials } from '@/lib/utils'

interface Props {
  user: ShellUser
}

/** Shows the signed-in account with its settings and sign-out actions. */
export function UserNav({ user }: Props) {
  const { pending, signOut } = useSignOut()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="flex size-12 shrink-0 touch-manipulation items-center justify-center rounded-full bg-muted font-medium text-foreground outline-none transition-colors hover:bg-foreground/10 focus-visible:ring-3 focus-visible:ring-ring"
      >
        {getInitials({ email: user.email, name: user.name })}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            {user.name ? <div>{user.name}</div> : null}
            <div>{user.email}</div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href="/settings" />}>
            <Settings aria-hidden="true" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={pending}
            onClick={() => {
              void signOut()
            }}
          >
            <LogOut aria-hidden="true" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
