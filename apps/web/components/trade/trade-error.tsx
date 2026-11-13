import { Button } from '@workspace/ui/components/button'
import { CircleAlert } from 'lucide-react'
import Link from 'next/link'

interface Props {
  message: string
  onRetry?: () => void
  title: string
}

/** Explains why the Trade screen could not load and offers a way forward. */
export function TradeError({ message, onRetry, title }: Props) {
  return (
    <div className="flex flex-col items-start gap-4 pt-4 md:pt-8">
      <span className="flex size-12 items-center justify-center rounded-full bg-danger/10 text-danger">
        <CircleAlert aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-1">
        <h1 className="font-bold text-xl tracking-tight">{title}</h1>
        <p className="max-w-md text-muted-foreground" role="alert">
          {message}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {onRetry ? (
          <Button onClick={onRetry} type="button">
            Try again
          </Button>
        ) : null}
        <Button
          nativeButton={false}
          render={<Link href="/portfolio" />}
          variant="ghost"
        >
          Go to portfolio
        </Button>
      </div>
    </div>
  )
}
