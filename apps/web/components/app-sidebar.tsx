'use client'

import { cn } from '@workspace/ui/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { isNavItemActive, navItems } from '@/lib/navigation'

/**
 * Icon rail on desktop; bottom bar with a fade background on mobile.
 */
export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'group/sidebar fixed z-20',
        'inset-x-0 bottom-0',
        'md:inset-auto md:top-1/2 md:left-3 md:w-14 md:-translate-y-1/2 md:overflow-hidden md:rounded-2xl md:p-1.5',
        'md:hover:w-44 md:hover:bg-card md:hover:shadow-sm md:hover:ring-1 md:hover:ring-border',
        'md:focus-within:w-44 md:focus-within:bg-card md:focus-within:shadow-sm md:focus-within:ring-1 md:focus-within:ring-border',
        'motion-reduce:transition-none motion-safe:md:transition-[width,background-color,box-shadow] motion-safe:md:duration-200 motion-safe:md:ease-out'
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-background [mask-image:linear-gradient(to_top,black_40%,transparent)] md:hidden"
      />
      <nav
        aria-label="Main"
        className="relative px-4 pt-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:p-0"
      >
        <ul className="flex items-stretch justify-around md:flex-col md:items-stretch md:justify-start md:gap-1">
          {navItems.map((item) => {
            const isActive = isNavItemActive({
              href: item.href,
              pathname,
            })

            return (
              <li key={item.href} className="flex-1 md:flex-none">
                <Link
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={item.title}
                  className={cn(
                    'flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl outline-none',
                    'text-muted-foreground transition-colors duration-200',
                    'text-xs md:text-base',
                    'hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring',
                    'md:h-11 md:flex-row md:justify-start md:gap-0 md:py-0',
                    isActive && 'font-medium text-foreground',
                    isActive &&
                      'md:group-hover/sidebar:bg-muted md:group-focus-within/sidebar:bg-muted'
                  )}
                >
                  <span className="flex shrink-0 items-center justify-center md:size-11">
                    <item.icon aria-hidden="true" className="size-4" />
                  </span>
                  <span
                    className={cn(
                      'whitespace-nowrap',
                      'md:opacity-0',
                      'md:group-hover/sidebar:opacity-100',
                      'md:group-focus-within/sidebar:opacity-100',
                      'motion-reduce:transition-none motion-safe:md:transition-opacity motion-safe:md:duration-200'
                    )}
                  >
                    {item.title}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
