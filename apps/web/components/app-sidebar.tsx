'use client'

import { cn } from '@workspace/ui/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { isNavItemActive, navItems } from '@/lib/navigation'

/**
 * Icon rail on desktop; bottom bar with a fade background on mobile.
 * Desktop rests as a left-edge border sliver and slides in on hover or focus.
 */
export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'group/sidebar fixed z-20',
        'inset-x-0 bottom-0',
        'md:inset-auto md:top-1/2 md:left-0 md:w-3 md:-translate-y-1/2 md:overflow-visible'
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-background [mask-image:linear-gradient(to_top,black_40%,transparent)] md:hidden"
      />
      <div
        className={cn(
          'relative',
          'md:w-14 md:overflow-hidden md:rounded-2xl md:bg-card md:p-1.5 md:ring-1 md:ring-border',
          'md:-translate-x-[calc(3.5rem-0.375rem)]',
          'md:group-hover/sidebar:w-44 md:group-hover/sidebar:translate-x-3 md:group-hover/sidebar:shadow-sm',
          'md:group-focus-within/sidebar:w-44 md:group-focus-within/sidebar:translate-x-3 md:group-focus-within/sidebar:shadow-sm',
          'motion-reduce:transition-none motion-safe:md:transition-[width,transform,box-shadow] motion-safe:md:duration-200 motion-safe:md:ease-out motion-safe:md:delay-150 motion-safe:md:group-hover/sidebar:delay-0 motion-safe:md:group-focus-within/sidebar:delay-0'
        )}
      >
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
      </div>
    </aside>
  )
}
