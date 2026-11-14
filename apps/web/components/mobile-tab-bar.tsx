'use client'

import { cn } from '@workspace/ui/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { TicketFab } from '@/components/order-ticket/ticket-fab'
import { useIsTyping } from '@/hooks/use-is-typing'
import { isNavItemActive, navItems } from '@/lib/navigation'

/**
 * Adapts the desktop navigation capsule into a mobile bottom tab bar that
 * fades the page out behind it, with the Buy / Sell button floating beside it.
 */
export function MobileTabBar() {
  const pathname = usePathname()
  // The keyboard covers the bottom of the screen while typing, and the bar
  // would sit on top of the focused field.
  const typing = useIsTyping()

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-0 z-40 bg-linear-to-t from-background via-background/80 to-transparent px-4 pt-16 pb-[max(1rem,env(safe-area-inset-bottom))] transition-[opacity,translate,visibility] duration-300 ease-[cubic-bezier(0.19,1,0.22,1)] motion-reduce:transition-none md:hidden',
        typing && 'invisible translate-y-full opacity-0'
      )}
    >
      <div className="flex items-center justify-center gap-3">
        <nav aria-label="Primary">
          <ul className="surface-floating pointer-events-auto flex w-fit items-center gap-2 rounded-full p-2">
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
          </ul>
        </nav>
        <TicketFab className="pointer-events-auto" />
      </div>
    </div>
  )
}
