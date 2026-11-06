import { cn } from '@workspace/ui/lib/utils'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

interface Props {
  children?: ReactNode
  href?: string
  id: string
  linkLabel?: string
  title: string
}

/** Titles a page section with an optional "view all" link and controls below. */
export function SectionHeader({
  children,
  href,
  id,
  linkLabel = 'View all',
  title,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold text-2xl tracking-tight" id={id}>
          {title}
        </h2>
        {href ? (
          <Link
            className={cn(
              'group -mr-3 inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 font-medium text-muted-foreground outline-none transition-colors',
              'hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring'
            )}
            href={href}
          >
            {linkLabel}
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            />
          </Link>
        ) : null}
      </div>
      {children}
    </div>
  )
}
