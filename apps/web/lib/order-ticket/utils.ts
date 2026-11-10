import {
  getAllowedOrderClasses,
  getAllowedOrderTypes,
  getAllowedTimesInForce,
} from '@/lib/alpaca/order-constraints'
import type { CreateOrderRequest } from '@/lib/alpaca/schemas'
import type { TicketAsset, TicketDraft } from '@/models/order-ticket/ticket'

/** Creates an empty ticket without assuming a symbol or account environment. */
export function createTicketDraft(): TicketDraft {
  return {
    amount: '1',
    asset: null,
    extendedHours: false,
    limitPrice: '',
    orderClass: 'simple',
    positionIntent: 'buy_to_open',
    quantityMode: 'qty',
    side: 'buy',
    stopLossLimitPrice: '',
    stopLossStopPrice: '',
    stopPrice: '',
    takeProfitLimitPrice: '',
    timeInForce: 'day',
    trail: '',
    trailMode: 'percent',
    type: 'market',
    otoLeg: 'take_profit',
  }
}

/** Normalizes dependent controls after an asset, size, or strategy changes. */
export function reconcileTicket(draft: TicketDraft): TicketDraft {
  const quantityMode = canUseDollars(draft) ? draft.quantityMode : 'qty'
  const orderClass = getAllowedOrderClasses(draft.asset?.assetClass).includes(
    draft.orderClass
  )
    ? draft.orderClass
    : 'simple'
  const types = getTicketOrderTypes({ ...draft, orderClass })
  const type = types.includes(draft.type) ? draft.type : (types[0] ?? 'market')
  const times = getAllowedTimesInForce({
    ...draft,
    assetClass: draft.asset?.assetClass,
    orderClass,
    quantityMode,
    type,
  })
  const timeInForce = times.includes(draft.timeInForce)
    ? draft.timeInForce
    : (times[0] ?? 'day')
  return {
    ...draft,
    orderClass,
    quantityMode,
    timeInForce,
    type,
    extendedHours:
      draft.extendedHours &&
      draft.asset?.assetClass === 'us_equity' &&
      orderClass === 'simple' &&
      type === 'limit' &&
      ['day', 'gtc'].includes(timeInForce),
  }
}

/** Returns whether the current asset and entry order accept a dollar amount. */
export function canUseDollars(draft: TicketDraft): boolean {
  return Boolean(
    draft.asset &&
      draft.asset.assetClass !== 'us_option' &&
      (draft.asset.assetClass === 'crypto' || draft.asset.fractionable) &&
      draft.orderClass === 'simple' &&
      draft.type === 'market'
  )
}

/** Lists only entry types accepted by the selected asset and strategy. */
export function getTicketOrderTypes(draft: TicketDraft): TicketDraft['type'][] {
  const types = getAllowedOrderTypes(draft.asset?.assetClass, draft.orderClass)
  return draft.orderClass === 'oto'
    ? types.filter((type) => type === 'market' || type === 'limit')
    : types
}

/** Builds a clean request, excluding values belonging to hidden controls. */
export function buildTicketRequest(draft: TicketDraft): CreateOrderRequest {
  const advanced = draft.orderClass !== 'simple'
  return {
    amount: draft.amount,
    assetClass: draft.asset?.assetClass ?? 'us_equity',
    extendedHours: draft.extendedHours,
    fractionable: draft.asset?.fractionable ?? false,
    orderClass: draft.orderClass,
    quantityMode: draft.quantityMode,
    side: draft.side,
    symbol: draft.asset?.symbol ?? '',
    timeInForce: draft.timeInForce,
    type: draft.type,
    ...(draft.asset?.assetClass === 'us_option'
      ? { positionIntent: draft.positionIntent }
      : {}),
    ...(['limit', 'stop_limit'].includes(draft.type)
      ? {
          limitPrice:
            draft.orderClass === 'oco'
              ? draft.takeProfitLimitPrice
              : draft.limitPrice,
        }
      : {}),
    ...(['stop', 'stop_limit'].includes(draft.type)
      ? { stopPrice: draft.stopPrice }
      : {}),
    ...(draft.type === 'trailing_stop'
      ? draft.trailMode === 'percent'
        ? { trailPercent: draft.trail }
        : { trailPrice: draft.trail }
      : {}),
    ...(advanced &&
    (draft.orderClass !== 'oto' || draft.otoLeg === 'take_profit')
      ? { takeProfitLimitPrice: draft.takeProfitLimitPrice }
      : {}),
    ...(advanced && (draft.orderClass !== 'oto' || draft.otoLeg === 'stop_loss')
      ? {
          stopLossStopPrice: draft.stopLossStopPrice,
          stopLossLimitPrice: draft.stopLossLimitPrice,
        }
      : {}),
  }
}

/** Estimates entry value; option premiums represent one hundred underlying shares. */
export function estimateTicketValue(
  draft: TicketDraft,
  price?: number
): number | undefined {
  const amount = Number(draft.amount)
  if (!Number.isFinite(amount) || amount <= 0) return undefined
  if (draft.quantityMode === 'notional') return amount
  const reference = getTicketReferencePrice(draft, price)
  if (reference === undefined) return undefined
  return (
    amount * reference * (draft.asset?.assetClass === 'us_option' ? 100 : 1)
  )
}

/**
 * Picks the per-unit price an order is expected to fill at: the entered limit
 * (or OCO take-profit) when there is one, otherwise the latest quote.
 */
export function getTicketReferencePrice(
  draft: TicketDraft,
  price?: number
): number | undefined {
  const entered =
    draft.orderClass === 'oco'
      ? Number(draft.takeProfitLimitPrice)
      : ['limit', 'stop_limit'].includes(draft.type)
        ? Number(draft.limitPrice)
        : undefined
  if (entered && Number.isFinite(entered) && entered > 0) return entered
  return price && Number.isFinite(price) && price > 0 ? price : undefined
}

interface ConvertTicketAmountOptions {
  draft: TicketDraft
  next: TicketDraft
  price?: number
}

/**
 * Carries the order size across a shares/dollars switch at the reference
 * price, so the estimate stays put. Returns an empty amount without a price.
 */
export function convertTicketAmount({
  draft,
  next,
  price,
}: ConvertTicketAmountOptions): string {
  const amount = Number(draft.amount)
  const reference = getTicketReferencePrice(next, price)
  if (!draft.amount || !Number.isFinite(amount) || amount <= 0 || !reference)
    return ''
  if (next.quantityMode === 'notional')
    return String(Math.round(amount * reference * 100) / 100)
  const shares = amount / reference
  const fractional =
    next.asset?.assetClass === 'crypto' || Boolean(next.asset?.fractionable)
  const rounded = fractional
    ? Math.floor(shares * 10_000) / 10_000
    : Math.floor(shares)
  return rounded > 0 ? String(rounded) : ''
}

/** Formats a known dollar estimate while keeping unavailable data explicit. */
export function formatTicketMoney(value?: number): string {
  return value === undefined || !Number.isFinite(value)
    ? '—'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
      }).format(value)
}

/** Clears prices and units when a different symbol is selected. */
export function selectTicketAsset(
  draft: TicketDraft,
  asset: TicketAsset | null
): TicketDraft {
  if (draft.asset?.symbol === asset?.symbol) return { ...draft, asset }
  return reconcileTicket({
    ...createTicketDraft(),
    asset,
    side: draft.side,
    positionIntent: draft.side === 'buy' ? 'buy_to_open' : 'sell_to_close',
  })
}

interface FocusTicketFieldOptions {
  field: string
  form: HTMLFormElement
}

/** Moves keyboard focus to the control behind a validation error and centers it. */
export function focusTicketField({
  field,
  form,
}: FocusTicketFieldOptions): void {
  const target = form.querySelector<HTMLElement>(
    `[data-order-field="${field === 'trailPrice' ? 'trailPercent' : field}"]`
  )
  if (!target) return
  const selector = 'input, select, button, [role=combobox], [role=checkbox]'
  const control = target.matches(selector)
    ? target
    : target.querySelector<HTMLElement>(selector)
  control?.focus()
  control?.scrollIntoView({ block: 'center', behavior: 'instant' })
}
