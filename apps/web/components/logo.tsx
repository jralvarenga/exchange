import { cn } from '@workspace/ui/lib/utils'

interface Props {
  className?: string
  /** `inverse` sits on a `primary` surface, such as the auth showcase. */
  tone?: 'default' | 'inverse'
}

/** The Exchange mark, a rising line in a coin, beside the wordmark. */
export function Logo({ className, tone = 'default' }: Props) {
  const inverse = tone === 'inverse'

  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg
        aria-hidden="true"
        className="size-8"
        fill="none"
        viewBox="0 0 32 32"
      >
        <circle
          className={inverse ? 'fill-primary-foreground' : 'fill-foreground'}
          cx="16"
          cy="16"
          r="16"
        />
        <path
          className={inverse ? 'stroke-primary' : 'stroke-background'}
          d="M8 20.5l4.5-4.5 3.5 3 7.5-8"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.5"
        />
        <circle className="fill-market-up" cx="23.5" cy="11" r="2.5" />
      </svg>
      <span className="font-bold text-xl tracking-tight">Exchange</span>
    </span>
  )
}
