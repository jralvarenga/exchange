'use client'

import { AccountFact } from '@/components/account/account-fact'
import { AccountFactsFallback } from '@/components/account/account-facts-fallback'
import { AccountNeedsKeys } from '@/components/account/account-needs-keys'
import { Section } from '@/components/section'
import { SectionHeader } from '@/components/section-header'
import { SectionUnavailable } from '@/components/section-unavailable'
import { useAccountOverview } from '@/hooks/use-account-overview'
import { formatCurrency } from '@/lib/utils'

interface Props {
  ready: boolean
}

const rows = ['Total', 'Reg T', 'Day trading', 'Non-marginable', 'Options']

/** Breaks buying power down by the kind of trade it can pay for. */
export function AccountBuyingPower({ ready }: Props) {
  const overview = useAccountOverview({ enabled: ready })

  return (
    <Section titleId="buying-power-title">
      <SectionHeader id="buying-power-title" title="Buying power" />
      {!ready ? (
        <AccountNeedsKeys label="Buying power loads once Alpaca accepts your keys." />
      ) : overview.isPending ? (
        <AccountFactsFallback label="Loading buying power" rows={rows} />
      ) : overview.isError && !overview.data ? (
        <SectionUnavailable
          label="Buying power unavailable."
          onRetry={() => void overview.refetch()}
        />
      ) : (
        <dl className="flex flex-col divide-y divide-border border-border border-y">
          {[
            {
              detail: 'What you can spend right now',
              label: 'Total',
              value: overview.data.buyingPower,
            },
            {
              detail: 'Overnight positions on margin',
              label: 'Reg T',
              value: overview.data.regtBuyingPower,
            },
            {
              detail: 'Positions opened and closed today',
              label: 'Day trading',
              value: overview.data.daytradingBuyingPower,
            },
            {
              detail: 'Crypto and other cash-only assets',
              label: 'Non-marginable',
              value: overview.data.nonMarginableBuyingPower,
            },
            {
              detail: 'Buying options contracts',
              label: 'Options',
              value: overview.data.optionsBuyingPower,
            },
          ].map((row) => (
            <AccountFact detail={row.detail} key={row.label} label={row.label}>
              {row.value === undefined ? (
                <span className="font-medium text-muted-foreground">
                  Not available
                </span>
              ) : (
                formatCurrency({
                  currency: overview.data.currency,
                  value: row.value,
                })
              )}
            </AccountFact>
          ))}
        </dl>
      )}
    </Section>
  )
}
