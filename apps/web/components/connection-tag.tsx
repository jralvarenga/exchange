import { cn } from '@workspace/ui/lib/utils'

interface Props {
  environment: 'live' | 'paper'
  status: 'invalid' | 'unverified' | 'valid'
}

/**
 * Names a connection's environment, or its problem when Alpaca rejected it.
 * Live is tinted as a warning because it moves real money.
 */
export function ConnectionTag({ environment, status }: Props) {
  const problem =
    status === 'invalid'
      ? 'Rejected'
      : status === 'unverified'
        ? 'Unverified'
        : undefined

  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-2 font-medium',
        problem
          ? 'bg-danger/10 text-danger'
          : environment === 'live'
            ? 'bg-warning/10 text-warning'
            : 'bg-muted text-muted-foreground'
      )}
    >
      {problem ?? (environment === 'live' ? 'Live' : 'Paper')}
    </span>
  )
}
