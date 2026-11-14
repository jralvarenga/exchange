'use client'

import { cn } from '@workspace/ui/lib/utils'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { TextMorph } from 'torph/react'

import { usePortfolio } from '@/hooks/use-portfolio'
import { getPositionsSummary } from '@/lib/portfolio/summary'
import {
  formatCurrency,
  formatSignedCurrency,
  formatSignedPercent,
  revealClassName,
} from '@/lib/utils'

const morphEase = 'cubic-bezier(0.19, 1, 0.22, 1)'

/** Shows what the holdings are worth, what they cost, and the open return. */
export function PortfolioPositionsSummary() {
  const { data } = usePortfolio()
  const summary = getPositionsSummary(data.positions)
  const gain = summary.unrealizedProfitLoss
  const ReturnIcon = gain < 0 ? ArrowDownRight : ArrowUpRight

  return (
    <dl
      aria-live="polite"
      className="grid grid-cols-1 divide-y divide-border border-border border-y sm:grid-cols-3 sm:divide-x sm:divide-y-0"
    >
      <div className={cn('flex flex-col gap-2 py-6 sm:pr-8', revealClassName)}>
        <dt className="font-medium text-muted-foreground">
          Market value
          <span className="sr-only">
            {' '}
            of {summary.positionCount}{' '}
            {summary.positionCount === 1 ? 'position' : 'positions'}
          </span>
        </dt>
        <dd className="font-bold text-3xl tabular-nums tracking-tight">
          <TextMorph as="span" duration={700} ease={morphEase} locale="en-US">
            {formatCurrency({ currency: 'USD', value: summary.marketValue })}
          </TextMorph>
        </dd>
      </div>
      <div
        className={cn(
          'flex flex-col gap-2 py-6 sm:px-8',
          revealClassName,
          'fill-mode-both delay-75'
        )}
      >
        <dt className="font-medium text-muted-foreground">Cost basis</dt>
        <dd className="font-bold text-3xl tabular-nums tracking-tight">
          <TextMorph as="span" duration={700} ease={morphEase} locale="en-US">
            {formatCurrency({ currency: 'USD', value: summary.costBasis })}
          </TextMorph>
        </dd>
      </div>
      <div
        className={cn(
          'flex flex-col gap-2 py-6 sm:pl-8',
          revealClassName,
          'fill-mode-both delay-150'
        )}
      >
        <dt className="font-medium text-muted-foreground">Unrealized return</dt>
        <dd
          className={cn(
            'flex flex-wrap items-baseline gap-x-3 gap-y-1 tabular-nums',
            gain > 0 && 'text-market-up',
            gain < 0 && 'text-market-down',
            gain === 0 && 'text-muted-foreground'
          )}
        >
          <TextMorph
            as="span"
            className="font-bold text-3xl tracking-tight"
            duration={700}
            ease={morphEase}
            locale="en-US"
          >
            {formatSignedCurrency({ currency: 'USD', value: gain })}
          </TextMorph>
          <span className="inline-flex items-center gap-0.5 font-medium">
            {gain === 0 ? null : (
              <ReturnIcon aria-hidden="true" className="size-4" />
            )}
            {formatSignedPercent({
              value: summary.unrealizedProfitLossPercent,
            })}
          </span>
        </dd>
      </div>
    </dl>
  )
}
