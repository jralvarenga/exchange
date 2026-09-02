interface Props {
  interval: string
}

/** Reserves chart space when the selected interval has no equity points. */
export function BalanceChartEmpty({ interval }: Props) {
  return (
    <div className="h-full min-h-48 w-full" role="status">
      <span className="sr-only">
        Balance history is unavailable for {interval}.
      </span>
    </div>
  )
}
