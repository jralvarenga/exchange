import { cn } from '@workspace/ui/lib/utils'

const sections = [
  { href: '#balances', label: 'Balances' },
  { href: '#limits', label: 'Limits' },
  { href: '#trading', label: 'Trading' },
  { href: '#keys', label: 'Keys' },
  { href: '#funding', label: 'Funding' },
  { href: '#appearance', label: 'Appearance' },
]

/** Jumps between the account sections; scrolls sideways on narrow screens. */
export function AccountSectionNav() {
  return (
    <nav
      aria-label="Account sections"
      className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:-mx-6 sm:px-6 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden"
    >
      <ul className="-ml-3 flex w-max gap-1">
        {sections.map((section) => (
          <li key={section.href}>
            <a
              className={cn(
                'inline-flex h-11 items-center rounded-full px-3 font-medium text-muted-foreground outline-none transition-colors',
                'hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring'
              )}
              href={section.href}
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
