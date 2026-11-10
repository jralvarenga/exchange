import type { TicketDraft } from '@/models/order-ticket/ticket'

interface TicketPriceOptions {
  draft: TicketDraft
  price?: number
}

interface ConvertTicketAmountOptions {
  draft: TicketDraft
  next: TicketDraft
  price?: number
}

/** Estimates entry value; option premiums represent one hundred underlying shares. */
export function estimateTicketValue({
  draft,
  price,
}: TicketPriceOptions): number | undefined {
  const amount = Number(draft.amount)
  if (!Number.isFinite(amount) || amount <= 0) return undefined
  if (draft.quantityMode === 'notional') return amount
  const reference = getTicketReferencePrice({ draft, price })
  if (reference === undefined) return undefined
  return (
    amount * reference * (draft.asset?.assetClass === 'us_option' ? 100 : 1)
  )
}

/**
 * Picks the per-unit price an order is expected to fill at: the entered limit
 * (or OCO take-profit) when there is one, otherwise the latest quote.
 */
export function getTicketReferencePrice({
  draft,
  price,
}: TicketPriceOptions): number | undefined {
  const entered =
    draft.orderClass === 'oco'
      ? Number(draft.takeProfitLimitPrice)
      : ['limit', 'stop_limit'].includes(draft.type)
        ? Number(draft.limitPrice)
        : undefined
  if (entered && Number.isFinite(entered) && entered > 0) return entered
  return price && Number.isFinite(price) && price > 0 ? price : undefined
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
  const reference = getTicketReferencePrice({ draft: next, price })
  if (!draft.amount || !Number.isFinite(amount) || amount <= 0 || !reference)
    return ''
  if (next.quantityMode === 'notional')
    return String(Math.round(amount * reference * 100) / 100)
  const shares = amount / reference
  const fractional =
    next.asset?.assetClass === 'crypto' || Boolean(next.asset?.fractionable)
  // Alpaca accepts up to 9 decimals, which keeps high-priced crypto exact.
  const rounded = fractional
    ? Number((Math.floor(shares * 1e9) / 1e9).toFixed(9))
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
