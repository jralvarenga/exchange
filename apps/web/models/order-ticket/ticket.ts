import type {
  AlpacaOrderClass,
  AlpacaOrderSide,
  AlpacaOrderType,
  AlpacaQuantityMode,
  AlpacaTimeInForce,
  AssetSearchResult,
  CreateOrderRequest,
} from '@/lib/alpaca/schemas'

export type TicketAsset = Omit<AssetSearchResult, 'assetClass'> & {
  assetClass: CreateOrderRequest['assetClass']
}

export type TicketDraft = {
  amount: string
  asset: TicketAsset | null
  extendedHours: boolean
  limitPrice: string
  orderClass: AlpacaOrderClass
  positionIntent: NonNullable<CreateOrderRequest['positionIntent']>
  quantityMode: AlpacaQuantityMode
  side: AlpacaOrderSide
  stopLossLimitPrice: string
  stopLossStopPrice: string
  stopPrice: string
  takeProfitLimitPrice: string
  timeInForce: AlpacaTimeInForce
  trail: string
  trailMode: 'percent' | 'dollars'
  type: AlpacaOrderType
  otoLeg: 'take_profit' | 'stop_loss'
}

export type OpenTicketOptions = {
  asset?: TicketAsset
  assetIdentifier?: string
  side?: AlpacaOrderSide
}

/** The last shares/dollars switch, so switching back restores the exact size. */
export type TicketConversion = {
  amount: string
  mode: AlpacaQuantityMode
  previousAmount: string
  previousMode: AlpacaQuantityMode
}
