'use client'

import { AccountFact } from '@/components/account/account-fact'
import { AccountFactsFallback } from '@/components/account/account-facts-fallback'
import { AccountNeedsKeys } from '@/components/account/account-needs-keys'
import { Section } from '@/components/section'
import { SectionHeader } from '@/components/section-header'
import { SectionStale } from '@/components/section-stale'
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
    <Section titleId="margin-title">
      <SectionHeader id="margin-title" title="Margin" />
      {!ready ? (
        <AccountNeedsKeys label="Margin loads once Alpaca accepts your keys." />
      ) : overview.isPending ? (
        <AccountFactsFallback label="Loading margin" rows={rows} />
      ) : overview.isError && !overview.data ? (
        <SectionUnavailable
          label="Margin unavailable."
          onRetry={() => void overview.refetch()}
        />
      ) : (
        <>
          {overview.isError ? (
            <SectionStale timestamp={overview.dataUpdatedAt} />
          ) : null}
          <dl className="flex flex-col divide-y divide-border border-border border-y">
            <AccountFact
              detail={getMultiplierDetail(overview.data.multiplier)}
              label="Multiplier"
            >
              {overview.data.multiplier}×
            </AccountFact>
            <AccountFact
              detail="Needed to open positions"
              label="Initial margin"
            >
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
            <AccountFact
              detail="Fees charged, not yet paid"
              label="Accrued fees"
            >
              {formatCurrency({
                currency: overview.data.currency,
                value: overview.data.accruedFees,
              })}
            </AccountFact>
          </dl>
        </>
      )}
    </Section>
  )
}

/**
 * Names the buying-power class Alpaca encodes in the multiplier. 1× covers both
 * cash and limited-margin accounts; the API does not tell them apart.
 */
function getMultiplierDetail(multiplier: number): string {
  if (multiplier >= 4) {
    return 'Day-trade buying power'
  }

  if (multiplier > 1) {
    return 'Overnight margin'
  }

  return 'Limited margin or cash'
}
