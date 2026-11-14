import { wordmark } from '@workspace/ui/lib/brand'
import { cn } from '@workspace/ui/lib/utils'

interface Props {
  className?: string
  /** `inverse` sits on a `primary` surface, such as the auth showcase. */
  tone?: 'default' | 'inverse'
}

/** The Treid wordmark, "treid." set as a single path. Size it with a height class. */
export function Logo({ className, tone = 'default' }: Props) {
  return (
    <svg
      aria-label="treid."
      className={cn(
        'h-5 w-auto shrink-0',
        tone === 'inverse' ? 'text-primary-foreground' : 'text-foreground',
        className
      )}
      fill="none"
      role="img"
      viewBox={wordmark.viewBox}
    >
      <path d={wordmark.path} fill="currentColor" />
    </svg>
  )
}
