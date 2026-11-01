'use client'

import { cn } from '@workspace/ui/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { isNavItemActive, navItems } from '@/lib/navigation'

/** Floats the grouped, icon-first desktop navigation rail over the page. */
export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="pointer-events-none fixed inset-y-0 left-8 z-40 hidden w-16 flex-col items-center justify-center md:flex">
      <nav aria-label="Primary">
        <ul className="surface-floating pointer-events-auto flex flex-col gap-2 rounded-full p-2">
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
    </aside>
  )
}
