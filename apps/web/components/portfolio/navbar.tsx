'use client'

import { cn } from '@workspace/ui/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { BuyAssetDialog } from '@/components/buy/buy-asset-dialog'
import { isNavItemActive, navItems } from '@/lib/navigation'
import { buttonVariants } from '@workspace/ui/components/button'

/** App header with desktop links, search, and the mobile tab bar. */
export function Navbar() {
  const pathname = usePathname()

  return (
    <>
      <header className="fixed top-0 right-0 left-0 z-50 flex min-h-16 w-full items-center bg-background/50 px-6 backdrop-blur-sm">
        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1">
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
                    className={cn(
                      buttonVariants({ variant: 'ghost' }),
                      'text-muted-foreground'
                    )}
                  >
                    <item.icon aria-hidden="true" className="size-4" />
                    {item.title}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
        <div className="flex-1" />
        <BuyAssetDialog />
      </header>
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-20 md:hidden"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-background [mask-image:linear-gradient(to_top,black_40%,transparent)]"
        />
        <ul className="relative flex items-stretch justify-around px-4 pt-6 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {navItems.map((item) => {
            const isActive = isNavItemActive({
              href: item.href,
              pathname,
            })

            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={item.title}
                  className={cn(
                    'flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl outline-none',
                    'text-muted-foreground text-xs transition-colors duration-200',
                    'hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring',
                    isActive && 'font-medium text-foreground'
                  )}
                >
                  <item.icon aria-hidden="true" className="size-4" />
                  <span className="whitespace-nowrap">{item.title}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}
