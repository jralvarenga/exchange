import type { CreateOrderRequest } from '@/lib/alpaca/schemas'
import type { TicketDraft } from '@/models/order-ticket/ticket'

interface CompareTicketSubmissionsOptions {
  current: TicketDraft
  next: TicketDraft
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

/**
 * Reports whether two drafts would place the same order. A retry can reuse
 * its client order ID only while this stays true.
 */
export function isSameTicketSubmission({
  current,
  next,
}: CompareTicketSubmissionsOptions): boolean {
  const left = buildTicketRequest(current)
  const right = buildTicketRequest(next)
  const fields = new Set<keyof CreateOrderRequest>([
    ...Object.keys(left),
    ...Object.keys(right),
  ] as (keyof CreateOrderRequest)[])
  for (const field of fields) {
    if (left[field] !== right[field]) return false
  }
  return true
}
