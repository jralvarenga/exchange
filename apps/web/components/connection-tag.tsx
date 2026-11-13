import { cn } from '@workspace/ui/lib/utils'

interface Props {
  environment: 'live' | 'paper'
  status: 'invalid' | 'unverified' | 'valid'
}

/**
 * Names a connection's environment, or its problem when it cannot be used.
 * Rejected keys read as danger; unverified ones and live, which moves real
 * money, read as warnings, matching the account's status pills.
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
        status === 'invalid'
          ? 'bg-danger/10 text-danger'
          : problem || environment === 'live'
            ? 'bg-warning/10 text-warning'
            : 'bg-muted text-muted-foreground'
      )}
    >
      {problem ?? (environment === 'live' ? 'Live' : 'Paper')}
    </span>
  )
}
