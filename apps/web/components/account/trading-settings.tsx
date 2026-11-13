'use client'

import { AccountNeedsKeys } from '@/components/account/account-needs-keys'
import { TradingSettingChoice } from '@/components/account/trading-setting-choice'
import { TradingSettingSwitch } from '@/components/account/trading-setting-switch'
import { TradingSettingsFallback } from '@/components/account/trading-settings-fallback'
import type { PillOption } from '@/components/pill-group'
import { SectionHeader } from '@/components/section-header'
import { SectionUnavailable } from '@/components/section-unavailable'
import { TradingLocked } from '@/components/trading-locked'
import { useOrderTicket } from '@/contexts/order-ticket-context'
import { useAccountConfigurations } from '@/hooks/use-account-configurations'
import { useAccountOverview } from '@/hooks/use-account-overview'
import { useUpdateAccountConfigurations } from '@/hooks/use-update-account-configurations'
import type {
  AccountConfigurations,
  UpdateAccountConfigurations,
} from '@/lib/alpaca/trading-schemas'
import { showErrorToast, showSuccessToast } from '@/lib/app-toast'

interface Props {
  ready: boolean
}

interface SaveOptions {
  changes: UpdateAccountConfigurations
  name: string
  success: string
}

type MarginMultiplier = AccountConfigurations['maxMarginMultiplier']

type OptionsLevel = '0' | '1' | '2' | '3'

const marginOptions: PillOption<MarginMultiplier>[] = [
  { label: '1×', value: '1' },
  { label: '2×', value: '2' },
  { label: '4×', value: '4' },
]

const optionsLevelOptions: PillOption<OptionsLevel>[] = [
  { label: 'Off', value: '0' },
  { label: 'Level 1', value: '1' },
  { label: 'Level 2', value: '2' },
  { label: 'Level 3', value: '3' },
]

/** Lets the trader change account trading rules, saving each change on its own. */
export function TradingSettings({ ready }: Props) {
  const configurations = useAccountConfigurations({ enabled: ready })
  const overview = useAccountOverview({ enabled: ready })
  const update = useUpdateAccountConfigurations()
  const approvedLevel = overview.data?.optionsApprovedLevel
  // Viewers, and paper traders on live, cannot change the trading rules.
  const { canTrade, tradeLock } = useOrderTicket()

  /** Saves one change and names it in a toast, whatever the outcome. */
  async function save(options: SaveOptions): Promise<void> {
    try {
      await update.mutateAsync(options.changes)
      showSuccessToast({ title: options.success })
    } catch (error) {
      showErrorToast({
        description:
          error instanceof Error ? error.message : 'Unable to save the change.',
        title: `${options.name} not saved`,
      })
    }
  }

  return (
    <section
      aria-labelledby="trading-title"
      className="flex scroll-mt-28 flex-col gap-4"
      id="trading"
    >
      <SectionHeader id="trading-title" title="Trading settings" />
      {!ready ? (
        <AccountNeedsKeys label="Trading settings load once Alpaca accepts your keys." />
      ) : configurations.isPending ? (
        <TradingSettingsFallback />
      ) : configurations.isError && !configurations.data ? (
        <SectionUnavailable
          label="Trading settings unavailable."
          onRetry={() => void configurations.refetch()}
        />
      ) : (
        <>
          {tradeLock ? <TradingLocked reason={tradeLock} /> : null}
          <ul className="flex flex-col divide-y divide-border border-border border-y">
            <TradingSettingSwitch
              disabled={!canTrade}
              checked={configurations.data.suspendTrade}
              description="Blocks new orders until you turn it back off."
              label="Pause trading"
              onCheckedChange={(checked) =>
                save({
                  changes: { suspendTrade: checked },
                  name: 'Pause trading',
                  success: checked ? 'Trading paused' : 'Trading resumed',
                })
              }
            />
            <TradingSettingSwitch
              disabled={!canTrade}
              checked={!configurations.data.noShorting}
              description="Off keeps the account long only."
              label="Short selling"
              onCheckedChange={(checked) =>
                save({
                  changes: { noShorting: !checked },
                  name: 'Short selling',
                  success: checked
                    ? 'Short selling turned on'
                    : 'Short selling turned off',
                })
              }
            />
            <TradingSettingSwitch
              disabled={!canTrade}
              checked={configurations.data.fractionalTrading}
              description="Trade dollar amounts and parts of a share."
              label="Fractional shares"
              onCheckedChange={(checked) =>
                save({
                  changes: { fractionalTrading: checked },
                  name: 'Fractional shares',
                  success: checked
                    ? 'Fractional shares turned on'
                    : 'Fractional shares turned off',
                })
              }
            />
            <TradingSettingSwitch
              disabled={!canTrade}
              checked={configurations.data.tradeConfirmEmail === 'all'}
              description="Alpaca emails you each time an order fills."
              label="Trade confirmation emails"
              onCheckedChange={(checked) =>
                save({
                  changes: { tradeConfirmEmail: checked ? 'all' : 'none' },
                  name: 'Trade confirmation emails',
                  success: checked
                    ? 'Trade emails turned on'
                    : 'Trade emails turned off',
                })
              }
            />
            <TradingSettingChoice
              disabled={!canTrade}
              description="1× trades with cash only. 4× applies to day trades."
              label="Maximum margin"
              onChange={(value) =>
                save({
                  changes: { maxMarginMultiplier: value },
                  name: 'Maximum margin',
                  success: `Maximum margin set to ${value}×`,
                })
              }
              options={marginOptions}
              value={configurations.data.maxMarginMultiplier}
            />
            <TradingSettingChoice
              disabled={!canTrade}
              description={
                approvedLevel === undefined
                  ? 'Caps the option strategies you can place.'
                  : `Caps the option strategies you can place. Alpaca approved level ${approvedLevel}.`
              }
              label="Options level limit"
              onChange={(value) =>
                save({
                  changes: { maxOptionsTradingLevel: Number(value) },
                  name: 'Options level limit',
                  success:
                    value === '0'
                      ? 'Options trading turned off'
                      : `Options limit set to level ${value}`,
                })
              }
              options={optionsLevelOptions.filter(
                (option) =>
                  approvedLevel === undefined ||
                  Number(option.value) <= approvedLevel
              )}
              value={
                String(
                  configurations.data.maxOptionsTradingLevel ??
                    approvedLevel ??
                    0
                ) as OptionsLevel
              }
            />
            <li className="flex min-h-20 flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div className="flex min-w-0 flex-col">
                <p className="font-medium">Day trade buying power</p>
                <p className="text-muted-foreground">
                  When Alpaca checks day-trade buying power. Set by Alpaca.
                </p>
              </div>
              <p className="shrink-0 font-medium sm:text-right">
                {getDayTradeCheckLabel(
                  configurations.data.dayTradeBuyingPowerCheck
                )}
              </p>
            </li>
            <li className="flex min-h-20 flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div className="flex min-w-0 flex-col">
                <p className="font-medium">Pattern day trader check</p>
                <p className="text-muted-foreground">
                  When Alpaca applies pattern day trader rules. Set by Alpaca.
                </p>
              </div>
              <p className="shrink-0 font-medium sm:text-right">
                {getDayTradeCheckLabel(
                  configurations.data.patternDayTraderCheck
                )}
              </p>
            </li>
          </ul>
        </>
      )}
    </section>
  )
}

/** Describes when Alpaca runs its day trade checks. */
function getDayTradeCheckLabel(
  check: AccountConfigurations['dayTradeBuyingPowerCheck']
): string {
  if (check === 'both') {
    return 'Entry and exit'
  }

  if (check === 'entry') {
    return 'On entry'
  }

  if (check === 'exit') {
    return 'On exit'
  }

  return 'Managed by Alpaca'
}
