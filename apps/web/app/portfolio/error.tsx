'use client'

import { Button } from '@workspace/ui/components/button'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function PortfolioError({ reset }: Props) {
  return (
    <div className="flex max-w-prose flex-col items-start gap-3">
      <h1 className="font-bold text-2xl">Portfolio unavailable</h1>
      <p className="text-muted-foreground">
        We could not load your holdings and orders. Your positions are safe;
        this is only a display problem.
      </p>
      <Button onClick={reset} size="lg">
        Try again
      </Button>
    </div>
  )
}
