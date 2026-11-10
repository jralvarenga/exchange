import {
  getAllowedOrderClasses,
  getAllowedOrderTypes,
  getAllowedTimesInForce,
} from '@/lib/alpaca/order-constraints'
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
    // Hidden prices must not resurface when the user switches types back.
    limitPrice: ['limit', 'stop_limit'].includes(type) ? draft.limitPrice : '',
    stopPrice: ['stop', 'stop_limit'].includes(type) ? draft.stopPrice : '',
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

interface SelectTicketAssetOptions {
  asset: TicketAsset | null
  draft: TicketDraft
}

/** Clears prices and units when a different symbol is selected. */
export function selectTicketAsset({
  asset,
  draft,
}: SelectTicketAssetOptions): TicketDraft {
  if (draft.asset?.symbol === asset?.symbol) return { ...draft, asset }
  return reconcileTicket({
    ...createTicketDraft(),
    asset,
    side: draft.side,
    positionIntent: draft.side === 'buy' ? 'buy_to_open' : 'sell_to_close',
  })
}
