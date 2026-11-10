'use client'

import { AccountBalancesFallback } from '@/components/account/account-balances-fallback'
import { AccountNeedsKeys } from '@/components/account/account-needs-keys'
import { AccountStat } from '@/components/account/account-stat'
import { SectionHeader } from '@/components/section-header'
import { SectionUnavailable } from '@/components/section-unavailable'
import { useAccountOverview } from '@/hooks/use-account-overview'
import { formatCurrency } from '@/lib/utils'

interface Props {
  ready: boolean
}

const cellClassName = 'lg:px-8 lg:first:pl-0 lg:last:pr-0'

/** Shows equity, cash and the long and short market value as an open strip. */
export function AccountBalances({ ready }: Props) {
  const overview = useAccountOverview({ enabled: ready })

  return (
    <section
      aria-labelledby="balances-title"
      className="flex scroll-mt-28 flex-col gap-4"
      id="balances"
    >
      <SectionHeader id="balances-title" title="Balances" />
      {!ready ? (
        <AccountNeedsKeys label="Balances load once Alpaca accepts your keys." />
      ) : overview.isPending ? (
        <AccountBalancesFallback />
      ) : overview.isError ? (
        <SectionUnavailable
          label="Balances unavailable."
          onRetry={() => void overview.refetch()}
        />
      ) : (
        <dl className="grid grid-cols-1 divide-y divide-border border-border border-y lg:grid-cols-4 lg:divide-x lg:divide-y-0">
          <AccountStat
            className={cellClassName}
            label="Equity"
            value={formatCurrency({
              currency: overview.data.currency,
              value: overview.data.equity,
            })}
          />
          <AccountStat
            className={`${cellClassName} fill-mode-both delay-75`}
            label="Cash"
            value={formatCurrency({
              currency: overview.data.currency,
              value: overview.data.cash,
            })}
          />
          <AccountStat
            className={`${cellClassName} fill-mode-both delay-150`}
            label="Long value"
            value={formatCurrency({
              currency: overview.data.currency,
              value: overview.data.longMarketValue,
            })}
          />
          <AccountStat
            className={`${cellClassName} fill-mode-both delay-200`}
            label="Short value"
            value={formatCurrency({
              currency: overview.data.currency,
              value: Math.abs(overview.data.shortMarketValue),
            })}
          />
        </dl>
      )}
    </section>
  )
}
