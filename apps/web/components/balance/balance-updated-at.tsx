'use client'

import { cn } from '@workspace/ui/lib/utils'
import { TextMorph } from 'torph/react'

import { useBalance } from '@/hooks/use-balance'
import { formatUpdatedAt, revealClassName } from '@/lib/utils'

/** Shows when the balance was last refreshed from Alpaca. */
export function BalanceUpdatedAt() {
  const { dataUpdatedAt } = useBalance()

  return (
    <p
      className={cn(
        'font-medium font-mono text-muted-foreground',
        revealClassName,
        'fill-mode-both delay-200'
      )}
    >
      <span className="sr-only">Updated </span>
      <TextMorph as="span" duration={500} locale="en-US">
        {formatUpdatedAt({ timestamp: dataUpdatedAt })}
      </TextMorph>
    </p>
  )
}
