'use client'

import { cn } from '@workspace/ui/lib/utils'
import { CalendarClock } from 'lucide-react'

import { formatAssetPrice } from '@/components/asset-detail/utils'
import { SectionUnavailable } from '@/components/section-unavailable'
import { TradePanelEmpty } from '@/components/trade/trade-panel-empty'
import { TradeRowsFallback } from '@/components/trade/trade-rows-fallback'
import { useCorporateActions } from '@/hooks/use-corporate-actions'
import type { CorporateAction } from '@/lib/alpaca/trading-schemas'
import { formatCalendarDate } from '@/lib/trade/format'
import { revealClassName } from '@/lib/utils'

interface Props {
  symbol: string
}

/** Names an announcement from its type and subtype, such as "Cash dividend". */
function getActionTitle(action: CorporateAction): string {
  const subType = action.subType.replaceAll('_', ' ').toLowerCase()
  const type = action.type.replaceAll('_', ' ').toLowerCase()
  const title = subType.includes(type) ? subType : `${subType} ${type}`

  return title.charAt(0).toUpperCase() + title.slice(1)
}

/** Describes the terms of an announcement: the cash amount or the share ratio. */
function getActionTerms(action: CorporateAction): string | undefined {
  if (action.cash !== undefined) {
    return `${formatAssetPrice({ value: action.cash })} per share`
  }

  if (action.newRate !== undefined && action.oldRate !== undefined) {
    return `${String(action.newRate)}-for-${String(action.oldRate)}${action.targetSymbol ? ` into ${action.targetSymbol}` : ''}`
  }

  return action.targetSymbol ? `Into ${action.targetSymbol}` : undefined
}

/** Lists dividends, splits, mergers, and spinoffs announced for a stock. */
export function TradeCorporateActions({ symbol }: Props) {
  const actions = useCorporateActions(symbol)

  if (actions.isPending) {
    return <TradeRowsFallback label="Loading corporate actions" />
  }

  if (actions.isError) {
    return (
      <SectionUnavailable
        label="Corporate actions unavailable."
        onRetry={() => void actions.refetch()}
      />
    )
  }

  if (actions.data.length === 0) {
    return (
      <TradePanelEmpty
        hint="Dividends, splits, mergers, and spinoffs will be listed here when announced."
        icon={CalendarClock}
        title={`No recent announcements for ${symbol}.`}
      />
    )
  }

  return (
    <ul className={cn('flex flex-col divide-y', revealClassName)}>
      {actions.data.map((action) => {
        const terms = getActionTerms(action)
        const dates = [
          action.exDate && `Ex-date ${formatCalendarDate(action.exDate)}`,
          action.recordDate &&
            `Record ${formatCalendarDate(action.recordDate)}`,
          action.payableDate &&
            `Payable ${formatCalendarDate(action.payableDate)}`,
        ].filter(Boolean)

        if (dates.length === 0 && action.declarationDate) {
          dates.push(`Declared ${formatCalendarDate(action.declarationDate)}`)
        }

        return (
          <li
            className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 py-3"
            key={action.id}
          >
            <div className="flex min-w-0 flex-col gap-1">
              <span className="font-bold">{getActionTitle(action)}</span>
              <span className="text-muted-foreground tabular-nums">
                {dates.length > 0 ? dates.join(' · ') : 'Dates not announced'}
              </span>
            </div>
            {terms ? (
              <span className="font-medium tabular-nums">{terms}</span>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
