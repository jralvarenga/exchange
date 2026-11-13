import { Button } from '@workspace/ui/components/button'
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
      <Button onClick={onRetry} type="button" variant="link">
        Try again
      </Button>
    </p>
  )
}
