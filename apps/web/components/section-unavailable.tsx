interface Props {
  label: string
  onRetry: () => void
}

/** Short section error with a recovery action after a query failure. */
export function SectionUnavailable({ label, onRetry }: Props) {
  return (
    <p className="py-8 font-medium text-muted-foreground">
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
