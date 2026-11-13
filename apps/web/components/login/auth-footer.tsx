import Link from 'next/link'

import { getLegalLinks } from '@/lib/legal'

const linkClassName =
  'rounded-md underline-offset-4 outline-none transition-colors hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring'

/** Quiet links to the legal pages at the foot of every auth form. */
export function AuthFooter() {
  const legalLinks = getLegalLinks()

  return (
    <nav
      aria-label="Legal"
      className="mt-auto flex items-center justify-center gap-2 text-muted-foreground text-sm"
    >
      <Link className={linkClassName} href={legalLinks.terms}>
        Terms of service
      </Link>
      <span aria-hidden="true">·</span>
      <Link className={linkClassName} href={legalLinks.privacy}>
        Privacy policy
      </Link>
    </nav>
  )
}
