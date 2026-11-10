'use client'

import { AccountFact } from '@/components/account/account-fact'
import { AccountFactsFallback } from '@/components/account/account-facts-fallback'
import { AccountNeedsKeys } from '@/components/account/account-needs-keys'
import { SectionHeader } from '@/components/section-header'
import { SectionUnavailable } from '@/components/section-unavailable'
import { useAccountOverview } from '@/hooks/use-account-overview'
import { formatCurrency } from '@/lib/utils'

interface Props {
  ready: boolean
}

const rows = [
  'Multiplier',
  'Initial margin',
  'Maintenance margin',
  'Margin cushion',
  'Accrued fees',
]

/** Shows the margin multiplier, requirements and how much room is left. */
export function AccountMargin({ ready }: Props) {
  const overview = useAccountOverview({ enabled: ready })

  return (
    <section
      aria-labelledby="margin-title"
      className="flex scroll-mt-28 flex-col gap-4"
    >
      <SectionHeader id="margin-title" title="Margin" />
      {!ready ? (
        <AccountNeedsKeys label="Margin loads once Alpaca accepts your keys." />
      ) : overview.isPending ? (
        <AccountFactsFallback label="Loading margin" rows={rows} />
      ) : overview.isError ? (
        <SectionUnavailable
          label="Margin unavailable."
          onRetry={() => void overview.refetch()}
        />
      ) : (
        <dl className="flex flex-col divide-y divide-border border-border border-y">
          <AccountFact
            detail={
              overview.data.multiplier > 1
                ? 'Margin account'
                : 'Cash account, no margin'
            }
            label="Multiplier"
          >
            {overview.data.multiplier}×
          </AccountFact>
          <AccountFact detail="Needed to open positions" label="Initial margin">
            {formatCurrency({
              currency: overview.data.currency,
              value: overview.data.initialMargin,
            })}
          </AccountFact>
          <AccountFact
            detail="Needed to keep positions open"
            label="Maintenance margin"
          >
            {formatCurrency({
              currency: overview.data.currency,
              value: overview.data.maintenanceMargin,
            })}
          </AccountFact>
          <AccountFact
            detail="Equity above maintenance before a call"
            label="Margin cushion"
          >
            {formatCurrency({
              currency: overview.data.currency,
              value: overview.data.equity - overview.data.maintenanceMargin,
            })}
          </AccountFact>
          <AccountFact detail="Fees charged, not yet paid" label="Accrued fees">
            {formatCurrency({
              currency: overview.data.currency,
              value: overview.data.accruedFees,
            })}
          </AccountFact>
        </dl>
      )}
    </section>
  )
}
