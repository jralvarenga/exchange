import { cn } from '@workspace/ui/lib/utils'

interface Props {
  className?: string
  label: string
  onRetry: () => void
}

/** Short section error with a recovery action after a query failure. */
export function SectionUnavailable({ className, label, onRetry }: Props) {
  return (
    <p className={cn('py-8 font-medium text-muted-foreground', className)}>
      {label}{' '}
      <button
        className="rounded-sm text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring"
        onClick={onRetry}
        type="button"
      >
        Try again
      </button>
    </p>
  )
}
