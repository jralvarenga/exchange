import { Button } from '@workspace/ui/components/button'

interface Props {
  onRetry: () => void
}

/** Keeps chart controls usable when only historical data fails. */
export function AssetChartError({ onRetry }: Props) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl bg-muted/50 px-6 text-center">
      <p className="font-medium text-base">Price history is unavailable</p>
      <p className="mt-1 text-muted-foreground text-sm">
        The asset summary is still current. Try loading this range again.
      </p>
      <Button
        className="mt-5 h-11 px-5"
        onClick={onRetry}
        type="button"
        variant="outline"
      >
        Retry chart
      </Button>
    </div>
  )
}
