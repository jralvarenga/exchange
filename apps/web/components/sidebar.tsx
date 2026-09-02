'use client'

import { cn } from '@workspace/ui/lib/utils'
import { Bell, Dices, LogOut, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { isNavItemActive, navItems } from '@/lib/navigation'

/** Renders the grouped, icon-first desktop navigation rail. */
export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden min-h-0 flex-col items-center px-3 py-5 md:flex">
      <Link
        href="/"
        aria-label="Exchange home"
        className="flex size-12 items-center justify-center rounded-full text-primary outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring"
      >
        <Dices aria-hidden="true" className="size-7" strokeWidth={2.5} />
      </Link>

      <nav aria-label="Primary" className="mt-8">
        <ul className="flex flex-col gap-2 rounded-full bg-card p-2">
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
                  title={item.title}
                  className={cn(
                    'flex size-12 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors',
                    'hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring',
                    isActive &&
                      'bg-foreground text-background hover:bg-foreground hover:text-background'
                  )}
                >
                  <item.icon aria-hidden="true" className="size-5" />
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <button
        type="button"
        aria-label="Sign out"
        title="Sign out"
        className="mt-auto flex size-12 items-center justify-center rounded-full bg-card text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring"
      >
        <LogOut aria-hidden="true" className="size-5" />
      </button>
    </aside>
  )
}
