'use client'

import { cn } from '@workspace/ui/lib/utils'
import { LogOut } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { logout } from '@/app/login/actions'
import { isNavItemActive, navItems } from '@/lib/navigation'

/** Adapts the desktop navigation capsule into a mobile bottom tab bar. */
export function MobileTabBar() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden"
    >
      <ul className="mx-auto flex w-fit items-center gap-2 rounded-full bg-card p-2 shadow-2xl ring-1 ring-border">
        {navItems.map((item) => {
          const isActive = isNavItemActive({
            href: item.href,
            pathname,
          })

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.title}
                className={cn(
                  'flex size-12 touch-manipulation items-center justify-center rounded-full text-muted-foreground outline-none transition-colors',
                  'focus-visible:ring-3 focus-visible:ring-ring active:bg-muted',
                  isActive && 'bg-foreground text-background'
                )}
              >
                <item.icon aria-hidden="true" className="size-5" />
              </Link>
            </li>
          )
        })}
        <li>
          <form action={logout}>
            <button
              type="submit"
              aria-label="Sign out"
              title="Sign out"
              className={cn(
                'flex size-12 touch-manipulation items-center justify-center rounded-full text-muted-foreground outline-none transition-colors',
                'focus-visible:ring-3 focus-visible:ring-ring active:bg-muted'
              )}
            >
              <LogOut aria-hidden="true" className="size-5" />
            </button>
          </form>
        </li>
      </ul>
    </nav>
  )
}
