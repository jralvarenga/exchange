import { Button } from '@workspace/ui/components/button'
import { CircleAlert } from 'lucide-react'

interface Props {
  message: string
  onRetry?: () => void
  title?: string
}

/** Gives a clear recovery action when asset data cannot be loaded. */
export function AssetDetailError({
  message,
  onRetry,
  title = 'Asset unavailable',
}: Props) {
  return (
    <div className="flex min-h-80 flex-1 flex-col items-center justify-center rounded-4xl bg-card px-6 text-center shadow-md ring-1 ring-foreground/5">
      <span className="flex size-12 items-center justify-center rounded-full bg-danger/10 text-danger">
        <CircleAlert aria-hidden="true" />
      </span>
      <h1 className="mt-5 font-bold text-2xl">{title}</h1>
      <p className="mt-2 max-w-md text-base text-muted-foreground">{message}</p>
      {onRetry ? (
        <Button className="mt-6 h-11 px-5" onClick={onRetry} type="button">
          Try again
        </Button>
      ) : null}
    </div>
  )
}
