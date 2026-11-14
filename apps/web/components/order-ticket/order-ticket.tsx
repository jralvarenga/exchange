'use client'

import { Button } from '@workspace/ui/components/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@workspace/ui/components/collapsible'
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  Clock3,
  ShieldCheck,
} from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { TextMorph } from 'torph/react'

import { AssetCombobox } from '@/components/assets/asset-combobox'
import { TicketAdvanced } from '@/components/order-ticket/ticket-advanced'
import { TicketContract } from '@/components/order-ticket/ticket-contract'
import { TicketField } from '@/components/order-ticket/ticket-field'
import { TicketPills } from '@/components/order-ticket/ticket-pills'
import { TicketSelect } from '@/components/order-ticket/ticket-select'
import { TradingLocked } from '@/components/trading-locked'
import { useOrderTicket } from '@/contexts/order-ticket-context'
import { useAccountOverview } from '@/hooks/use-account-overview'
import { useMarketClock } from '@/hooks/use-market-clock'
import { useTicketQuote } from '@/hooks/use-ticket-quote'
import { createOrderRequestSchema } from '@/lib/alpaca/schemas'
import {
  canUseDollars,
  getTicketOrderTypes,
  getTicketUnderlying,
  isChoosingTicketContract,
  isTicketOptionMode,
  reconcileTicket,
} from '@/lib/order-ticket/draft'
import { focusTicketField } from '@/lib/order-ticket/focus'
import {
  convertTicketAmount,
  estimateTicketValue,
  formatTicketMoney,
} from '@/lib/order-ticket/pricing'
import { buildTicketRequest } from '@/lib/order-ticket/request'
import type {
  TicketConversion,
  TicketDraft,
} from '@/models/order-ticket/ticket'

const typeLabels = {
  market: 'Market',
  limit: 'Limit',
  stop: 'Stop',
  stop_limit: 'Stop limit',
  trailing_stop: 'Trailing stop',
}
const typeDescriptions = {
  market: 'Fills at the best available price. The final price may vary.',
  limit: 'Fills at your limit price or better.',
  stop: 'Becomes a market order when your stop price is reached.',
  stop_limit: 'Becomes a limit order when your stop price is reached.',
  trailing_stop:
    'Follows the market, then triggers when it reverses by your trail.',
}

/** Renders the same asset-aware order form in the dock, sheet, and drawer. */
export function OrderTicket() {
  const {
    canTrade,
    clearOrderMessages,
    draft,
    environment,
    isResolving,
    isSubmitting,
    orderError,
    orderSuccess,
    submitOrder,
    tradeLock,
    updateDraft,
  } = useOrderTicket()
  const optionMode = isTicketOptionMode(draft)
  const choosingContract = isChoosingTicketContract(draft)
  const snapshot = useTicketQuote(choosingContract ? null : draft.asset)
  const overview = useAccountOverview()
  const clock = useMarketClock()
  const [attempted, setAttempted] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const underlying = useMemo(
    () => getTicketUnderlying(draft.asset),
    [draft.asset]
  )
  const conversion = useRef<TicketConversion | null>(null)
  const request = buildTicketRequest(draft)
  const result = createOrderRequestSchema.safeParse(request)
  const errors: Record<string, string> = {}
  if (attempted && !result.success) {
    for (const issue of result.error.issues)
      errors[String(issue.path[0])] ??= issue.message
  }
  if (attempted && choosingContract)
    errors.symbol = 'Select an option contract.'
  else if (attempted && !draft.asset)
    errors.symbol = 'Select an asset to place an order.'
  const quote =
    draft.side === 'buy' ? snapshot.data?.askPrice : snapshot.data?.bidPrice
  const price = quote && quote > 0 ? quote : snapshot.data?.lastPrice
  const estimated = choosingContract
    ? undefined
    : estimateTicketValue({ draft, price })

  /** Applies an edit, converting the size when it switches between shares and dollars. */
  function changeDraft(patch: Partial<TicketDraft>): void {
    const next = reconcileTicket({ ...draft, ...patch })
    if (
      next.quantityMode === draft.quantityMode ||
      patch.amount !== undefined
    ) {
      updateDraft(patch)
      return
    }
    const last = conversion.current
    // Switching straight back restores the exact size instead of a rounded one.
    const amount =
      last &&
      last.symbol === draft.asset?.symbol &&
      last.mode === draft.quantityMode &&
      last.amount === draft.amount &&
      last.previousMode === next.quantityMode
        ? last.previousAmount
        : convertTicketAmount({ draft, next, price })
    conversion.current = {
      amount,
      mode: next.quantityMode,
      previousAmount: draft.amount,
      previousMode: draft.quantityMode,
      symbol: draft.asset?.symbol,
    }
    updateDraft({ ...patch, amount })
  }

  /** Switches between the stock and a contract written on it. */
  function changeInstrument(next: 'option' | 'shares'): void {
    if (next === 'option') {
      updateDraft({ preferOption: true })
      return
    }
    if (draft.asset?.assetClass === 'us_option' && draft.asset.underlying) {
      updateDraft({ asset: draft.asset.underlying, preferOption: false })
      return
    }
    updateDraft({ preferOption: false })
  }

  /** Drops the selected contract while keeping its stock in the ticket. */
  function clearContract(): void {
    if (draft.asset?.assetClass !== 'us_option' || !draft.asset.underlying)
      return
    updateDraft({ asset: draft.asset.underlying, preferOption: true })
  }
  const power = optionMode
    ? overview.data?.optionsBuyingPower
    : draft.asset?.assetClass === 'crypto'
      ? overview.data?.nonMarginableBuyingPower
      : overview.data?.buyingPower
  const after =
    draft.side === 'buy' && power !== undefined && estimated !== undefined
      ? power - estimated
      : undefined
  const waits =
    draft.asset &&
    draft.asset.assetClass !== 'crypto' &&
    clock.data &&
    !clock.data.isOpen &&
    !(draft.extendedHours && clock.data.session === 'extended')
  const blocked =
    overview.data?.tradingBlocked ||
    overview.data?.accountBlocked ||
    overview.data?.tradeSuspendedByUser
  const sideLabel = draft.side === 'buy' ? 'Buy' : 'Sell'
  const environmentLabel = environment === 'paper' ? 'Paper' : 'Live'
  const tradedName =
    draft.asset?.assetClass === 'us_option'
      ? draft.asset.name
      : (draft.asset?.symbol ?? 'an asset')
  const size =
    draft.quantityMode === 'notional'
      ? formatTicketMoney(Number(draft.amount) || 0)
      : draft.amount || '0'
  const advancedErrors = [
    'timeInForce',
    'extendedHours',
    'orderClass',
    'takeProfitLimitPrice',
    'stopLossStopPrice',
    'stopLossLimitPrice',
  ].some((field) => errors[field])

  return (
    <form
      className="flex min-h-0 flex-col text-base"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        if (!canTrade) return
        clearOrderMessages()
        setAttempted(true)
        if (choosingContract || !draft.asset || !result.success) {
          if (
            advancedErrors ||
            (!result.success &&
              result.error.issues.some((issue) =>
                [
                  'takeProfitLimitPrice',
                  'stopLossStopPrice',
                  'stopLossLimitPrice',
                  'orderClass',
                  'timeInForce',
                  'extendedHours',
                ].includes(String(issue.path[0]))
              ))
          )
            setAdvancedOpen(true)
          const form = event.currentTarget
          const first =
            !draft.asset || choosingContract
              ? 'symbol'
              : !result.success && String(result.error.issues[0]?.path[0])
          // Wait a frame so a just-opened Advanced panel can take focus.
          if (first)
            requestAnimationFrame(() =>
              focusTicketField({
                field: first,
                form,
                orderClass: draft.orderClass,
              })
            )
          return
        }
        void submitOrder(result.data).then((accepted) => {
          // The cleared amount of a placed order is not a mistake to flag.
          if (accepted) setAttempted(false)
        })
      }}
    >
      <fieldset
        className="flex min-w-0 flex-col gap-5 border-0 disabled:opacity-65"
        disabled={isSubmitting || isResolving}
      >
        <legend className="sr-only">Order details</legend>
        <div className="flex flex-col gap-4 overflow-hidden border-b pb-5">
          <div className="flex flex-wrap items-center justify-between gap-3 text-muted-foreground">
            <span className="flex items-center gap-2">
              <ShieldCheck aria-hidden="true" className="size-4" />
              {environmentLabel} account
            </span>
            <span>
              {draft.asset?.assetClass === 'crypto'
                ? '24/7 market'
                : clock.data?.isOpen
                  ? 'Market open'
                  : clock.data
                    ? 'Market closed'
                    : 'Session unavailable'}
            </span>
          </div>
          <div className="flex flex-col gap-4" data-order-field="symbol">
            <AssetCombobox
              onValueChange={(asset) => updateDraft({ asset })}
              placeholder="Choose a symbol…"
              value={underlying}
            />
            {underlying?.assetClass === 'us_equity' ? (
              <TicketPills
                label="Instrument"
                onChange={changeInstrument}
                options={[
                  { label: 'Shares', value: 'shares' },
                  { label: 'Option', value: 'option' },
                ]}
                value={optionMode ? 'option' : 'shares'}
              />
            ) : null}
            {optionMode && underlying ? (
              <TicketContract
                contract={
                  draft.asset?.assetClass === 'us_option' ? draft.asset : null
                }
                onClear={clearContract}
                onSelect={(asset) => updateDraft({ asset })}
                underlying={underlying}
              />
            ) : null}
            {draft.asset?.assetClass === 'us_option' && !underlying ? (
              <p className="break-all font-bold">{draft.asset.symbol}</p>
            ) : null}
            {errors.symbol ? (
              <p className="text-destructive">{errors.symbol}</p>
            ) : null}
          </div>
          {isResolving ? (
            <p role="status" className="text-muted-foreground">
              Finding your symbol…
            </p>
          ) : null}
          <div aria-atomic="true" aria-live="polite">
            <p className="text-muted-foreground">
              Estimated {draft.side === 'buy' ? 'cost' : 'proceeds'}
            </p>
            <TextMorph
              className="mt-1 block whitespace-nowrap font-bold text-5xl tabular-nums tracking-tighter"
              duration={700}
            >
              {formatTicketMoney(estimated)}
            </TextMorph>
            <p className="mt-2 text-muted-foreground tabular-nums">
              {choosingContract
                ? 'Select a contract to price this order'
                : draft.asset
                  ? `${tradedName} · ${formatTicketMoney(price)} ${snapshot.isFetching ? 'updating' : 'latest quote'}`
                  : 'Select an asset to get started'}
            </p>
          </div>
        </div>
        <fieldset className="grid grid-cols-2 gap-2">
          <legend className="sr-only">Order side</legend>
          <Button
            aria-pressed={draft.side === 'buy'}
            onClick={() =>
              changeDraft({ side: 'buy', positionIntent: 'buy_to_open' })
            }
            type="button"
            variant={draft.side === 'buy' ? 'secondary' : 'ghost'}
          >
            <ArrowUpRight aria-hidden="true" />
            Buy
          </Button>
          <Button
            aria-pressed={draft.side === 'sell'}
            onClick={() =>
              changeDraft({ side: 'sell', positionIntent: 'sell_to_close' })
            }
            type="button"
            variant={draft.side === 'sell' ? 'secondary' : 'ghost'}
          >
            <ArrowDownLeft aria-hidden="true" />
            Sell
          </Button>
        </fieldset>
        <div className="flex flex-col gap-3">
          <TicketField
            name="amount"
            controls={
              canUseDollars(draft) ? (
                <TicketPills
                  hideLabel
                  label="Order in"
                  onChange={(quantityMode) => changeDraft({ quantityMode })}
                  options={[
                    {
                      label:
                        draft.asset?.assetClass === 'crypto'
                          ? 'Units'
                          : 'Shares',
                      value: 'qty',
                    },
                    { label: 'Dollars', value: 'notional' },
                  ]}
                  value={draft.quantityMode}
                />
              ) : null
            }
            error={errors.amount}
            label={
              draft.quantityMode === 'notional'
                ? 'Dollar amount'
                : draft.asset?.assetClass === 'us_option'
                  ? 'Contracts'
                  : 'Quantity'
            }
            onChange={(amount) => changeDraft({ amount })}
            step={
              draft.asset?.assetClass === 'us_option' ||
              draft.asset?.fractionable === false
                ? '1'
                : 'any'
            }
            value={draft.amount}
          />
          {draft.asset?.assetClass === 'us_option' ? (
            <p className="text-muted-foreground">
              Whole contracts only. Each contract represents 100 shares.
            </p>
          ) : draft.asset?.fractionable === false ? (
            <p className="text-muted-foreground">
              This asset trades in whole shares.
            </p>
          ) : null}
        </div>
        {draft.asset?.assetClass === 'us_option' ? (
          <TicketSelect
            name="positionIntent"
            error={errors.positionIntent}
            label="Position intent"
            onChange={(positionIntent) => changeDraft({ positionIntent })}
            options={
              draft.side === 'buy'
                ? [
                    { label: 'Buy to open', value: 'buy_to_open' },
                    { label: 'Buy to close', value: 'buy_to_close' },
                  ]
                : [
                    { label: 'Sell to close', value: 'sell_to_close' },
                    { label: 'Sell to open', value: 'sell_to_open' },
                  ]
            }
            value={draft.positionIntent}
          />
        ) : null}
        <div data-order-field="type" className="flex flex-col gap-3">
          <TicketPills
            label="Order type"
            onChange={(type) => changeDraft({ type })}
            options={getTicketOrderTypes(draft).map((value) => ({
              label: typeLabels[value],
              value,
            }))}
            value={draft.type}
          />
          <p className="text-muted-foreground">
            {typeDescriptions[draft.type]}
          </p>
          {errors.type ? (
            <p className="text-destructive">{errors.type}</p>
          ) : null}
        </div>
        {['limit', 'stop_limit'].includes(draft.type) &&
        draft.orderClass !== 'oco' ? (
          <TicketField
            name="limitPrice"
            error={errors.limitPrice}
            label="Limit price"
            onChange={(limitPrice) => changeDraft({ limitPrice })}
            value={draft.limitPrice}
          />
        ) : null}
        {['stop', 'stop_limit'].includes(draft.type) ? (
          <TicketField
            name="stopPrice"
            error={errors.stopPrice}
            label="Stop price"
            onChange={(stopPrice) => changeDraft({ stopPrice })}
            value={draft.stopPrice}
          />
        ) : null}
        {draft.type === 'trailing_stop' ? (
          <div className="flex flex-col gap-4">
            <TicketPills
              label="Trail by"
              onChange={(trailMode) => changeDraft({ trailMode })}
              options={[
                { label: 'Percent', value: 'percent' },
                { label: 'Dollars', value: 'dollars' },
              ]}
              value={draft.trailMode}
            />
            <TicketField
              name="trailPercent"
              error={errors.trailPercent ?? errors.trailPrice}
              label={
                draft.trailMode === 'percent' ? 'Trail percent' : 'Trail amount'
              }
              onChange={(trail) => changeDraft({ trail })}
              value={draft.trail}
            />
          </div>
        ) : null}
        <Collapsible
          className="border-y py-2"
          onOpenChange={setAdvancedOpen}
          open={advancedOpen}
        >
          <CollapsibleTrigger
            className="group/advanced w-full"
            render={<Button type="button" variant="ghost" />}
          >
            Advanced
            <span className="ml-auto text-muted-foreground">
              {draft.orderClass === 'simple'
                ? draft.timeInForce === 'day'
                  ? 'Day'
                  : draft.timeInForce === 'gtc'
                    ? 'Good until canceled'
                    : 'Duration'
                : draft.orderClass === 'bracket'
                  ? 'Bracket'
                  : draft.orderClass === 'oco'
                    ? 'OCO'
                    : 'OTO'}
            </span>
            <ChevronDown
              aria-hidden="true"
              className="transition-transform duration-200 group-data-panel-open/advanced:rotate-180 motion-reduce:transition-none"
            />
          </CollapsibleTrigger>
          <CollapsibleContent
            className="-mx-1 h-(--collapsible-panel-height) overflow-hidden px-1 pb-1 transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0 motion-reduce:transition-none"
            keepMounted
          >
            <TicketAdvanced
              draft={draft}
              errors={errors}
              onChange={changeDraft}
            />
          </CollapsibleContent>
        </Collapsible>
        {waits ? (
          <p className="flex items-start gap-2 text-muted-foreground">
            <Clock3 aria-hidden="true" className="mt-1 size-4 shrink-0" />
            <span>
              {draft.orderClass === 'oco'
                ? 'Linked exits trigger during eligible market sessions.'
                : draft.extendedHours
                  ? 'Eligible to fill when the next extended session opens.'
                  : 'This order waits for the next eligible market session.'}
            </span>
          </p>
        ) : null}
        {snapshot.isError ? (
          <p className="text-muted-foreground">
            Quote unavailable. The estimate will appear when a price is
            available.
          </p>
        ) : null}
        {clock.isError && draft.asset?.assetClass !== 'crypto' ? (
          <p className="text-muted-foreground">
            Market session unavailable. Check trading hours before placing an
            order.
          </p>
        ) : null}
        <dl aria-live="polite" className="flex flex-col gap-3 tabular-nums">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Buying power</dt>
            <dd>{formatTicketMoney(power)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">After this order, est.</dt>
            <dd>{formatTicketMoney(after)}</dd>
          </div>
        </dl>
        {blocked ? (
          <p role="alert" className="text-destructive">
            Trading is restricted on this account. Check your account status
            before placing an order.
          </p>
        ) : null}
        {overview.isError ? (
          <p className="text-muted-foreground">Buying power unavailable.</p>
        ) : null}
        {orderError ? (
          <p
            className="rounded-2xl bg-destructive/5 p-4 text-destructive"
            role="alert"
          >
            {orderError}
          </p>
        ) : null}
        {orderSuccess ? (
          <p className="text-market-up" role="status">
            {orderSuccess}
          </p>
        ) : null}
        <div className="sticky bottom-0 mt-8 flex flex-col gap-3 bg-background pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] before:pointer-events-none before:absolute before:inset-x-0 before:bottom-full before:h-10 before:bg-linear-to-t before:from-background before:to-transparent">
          <Button
            className="w-full"
            disabled={
              isResolving ||
              choosingContract ||
              !draft.asset ||
              isSubmitting ||
              blocked ||
              !canTrade
            }
            type="submit"
          >
            {isSubmitting
              ? 'Submitting order…'
              : tradeLock === 'viewer'
                ? 'View only'
                : tradeLock === 'paper_only'
                  ? 'Paper only'
                  : choosingContract
                    ? 'Select a contract'
                    : `${sideLabel} ${size} ${tradedName} · ${environmentLabel}`}
          </Button>
          {tradeLock === null ? (
            <p className="text-center text-muted-foreground">
              {environment === 'paper'
                ? 'Simulated trading. No real money moves.'
                : 'Live trading. This order uses real money.'}
            </p>
          ) : (
            <TradingLocked reason={tradeLock} />
          )}
        </div>
      </fieldset>
    </form>
  )
}
