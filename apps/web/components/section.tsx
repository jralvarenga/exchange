import { cn } from '@workspace/ui/lib/utils'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Layout only, such as a max width. Spacing belongs to this component. */
  className?: string
  /** Anchor for in-page links, such as `#balances`. */
  id?: string
  /** The id of the section's heading, usually its `SectionHeader`. */
  titleId: string
}

/**
 * A page section: its heading and content with the standard gap between them,
 * and the vertical space that separates it from the sections around it. Pages
 * stack sections without their own gaps so the rhythm lives here.
 */
export function Section({ children, className, id, titleId }: Props) {
  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        'flex scroll-mt-28 flex-col gap-4 py-8 md:py-12',
        className
      )}
      id={id}
    >
      {children}
    </section>
  )
}
