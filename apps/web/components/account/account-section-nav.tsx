import { cn } from '@workspace/ui/lib/utils'

import { accountSections } from '@/lib/account/sections'

/** Jumps between the account sections; scrolls sideways on narrow screens. */
export function AccountSectionNav() {
  return (
    <nav
      aria-label="Account sections"
      className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:-mx-6 sm:px-6 md:-mx-3 md:px-3 [&::-webkit-scrollbar]:hidden"
    >
      <ul className="-ml-3 flex w-max gap-1">
        {accountSections.map((section) => (
          <li key={section.id}>
            <a
              className={cn(
                'inline-flex h-11 items-center rounded-full px-3 font-medium text-muted-foreground outline-none transition-colors',
                'hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring'
              )}
              href={`#${section.id}`}
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
