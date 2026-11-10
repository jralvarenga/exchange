'use client'

import { AccountFact } from '@/components/account/account-fact'
import { AccountFactsFallback } from '@/components/account/account-facts-fallback'
import { AccountNeedsKeys } from '@/components/account/account-needs-keys'
import { SectionHeader } from '@/components/section-header'
import { SectionUnavailable } from '@/components/section-unavailable'
import { StatusPill } from '@/components/status-pill'
import { useAccountOverview } from '@/hooks/use-account-overview'
import { getAccountStatusInfo } from '@/lib/account/status'

interface Props {
  ready: boolean
}

const rows = [
  'Trading',
  'Transfers',
  'Account',
  'Pattern day trader',
  'Day trades',
  'Short selling',
  'Options',
  'Crypto',
]

/** Day trades allowed in five business days before the PDT rule applies. */
const DAY_TRADE_LIMIT = 3

/** Lists the blocks, flags and permissions that decide what the account can do. */
export function AccountLimits({ ready }: Props) {
  const overview = useAccountOverview({ enabled: ready })

  return (
    <section
      aria-labelledby="limits-title"
      className="flex scroll-mt-28 flex-col gap-4"
      id="limits"
    >
      <SectionHeader id="limits-title" title="Status and limits" />
      {!ready ? (
        <AccountNeedsKeys label="Limits load once Alpaca accepts your keys." />
      ) : overview.isPending ? (
        <AccountFactsFallback label="Loading status and limits" rows={rows} />
      ) : overview.isError && !overview.data ? (
        <SectionUnavailable
          label="Status and limits unavailable."
          onRetry={() => void overview.refetch()}
        />
      ) : (
        <dl className="flex flex-col divide-y divide-border border-border border-y">
          <AccountFact
            detail={
              overview.data.tradeSuspendedByUser
                ? 'You paused it in trading settings'
                : 'Placing new orders'
            }
            label="Trading"
          >
            <StatusPill
              status={
                overview.data.tradingBlocked
                  ? { label: 'Blocked', tone: 'negative' }
                  : overview.data.tradeSuspendedByUser
                    ? { label: 'Paused', tone: 'warning' }
                    : { label: 'Allowed', tone: 'positive' }
              }
            />
          </AccountFact>
          <AccountFact detail="Deposits and withdrawals" label="Transfers">
            <StatusPill
              status={
                overview.data.transfersBlocked
                  ? { label: 'Blocked', tone: 'negative' }
                  : { label: 'Allowed', tone: 'positive' }
              }
            />
          </AccountFact>
          <AccountFact detail="Set by Alpaca" label="Account">
            <StatusPill
              status={
                overview.data.accountBlocked
                  ? { label: 'Blocked', tone: 'negative' }
                  : { label: 'In good standing', tone: 'positive' }
              }
            />
          </AccountFact>
          <AccountFact
            detail="Four or more day trades in five days"
            label="Pattern day trader"
          >
            <StatusPill
              status={
                overview.data.patternDayTrader
                  ? { label: 'Flagged', tone: 'warning' }
                  : { label: 'Not flagged', tone: 'neutral' }
              }
            />
          </AccountFact>
          <AccountFact detail="Last five business days" label="Day trades">
            {overview.data.daytradeCount}
            {overview.data.patternDayTrader ? null : (
              <span className="font-medium text-muted-foreground">
                of {DAY_TRADE_LIMIT}
              </span>
            )}
          </AccountFact>
          <AccountFact
            detail="Selling assets you don't own"
            label="Short selling"
          >
            <StatusPill
              status={
                overview.data.shortingEnabled
                  ? { label: 'Enabled', tone: 'positive' }
                  : { label: 'Off', tone: 'neutral' }
              }
            />
          </AccountFact>
          <AccountFact
            detail={
              overview.data.optionsApprovedLevel === undefined
                ? 'Strategies you can trade'
                : `Approved up to level ${overview.data.optionsApprovedLevel}`
            }
            label="Options"
          >
            {overview.data.optionsTradingLevel ? (
              `Level ${overview.data.optionsTradingLevel}`
            ) : (
              <span className="font-medium text-muted-foreground">
                Not enabled
              </span>
            )}
          </AccountFact>
          <AccountFact detail="Buying and selling crypto" label="Crypto">
            <StatusPill
              status={getAccountStatusInfo(overview.data.cryptoStatus)}
            />
          </AccountFact>
        </dl>
      )}
    </section>
  )
}
