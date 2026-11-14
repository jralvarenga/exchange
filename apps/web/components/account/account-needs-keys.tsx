import Link from 'next/link'

import { getAccountSectionHref } from '@/lib/account/sections'

interface Props {
  label: string
}

/** Explains that a section waits on valid Alpaca keys and opens the connections tab. */
export function AccountNeedsKeys({ label }: Props) {
  return (
    <p className="py-8 font-medium text-muted-foreground">
      {label}{' '}
      <Link
        className="rounded-sm text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring"
        href={getAccountSectionHref('connections')}
      >
        Add a connection
      </Link>
    </p>
  )
}
