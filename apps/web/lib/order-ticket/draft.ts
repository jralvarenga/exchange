import type { OptionContract } from '@/lib/alpaca/market-schemas'
import {
  getAllowedOrderClasses,
  getAllowedOrderTypes,
  getAllowedTimesInForce,
} from '@/lib/alpaca/order-constraints'
import type { AssetSearchResult } from '@/lib/alpaca/schemas'
import type {
  OpenTicketOptions,
  TicketAsset,
  TicketDraft,
} from '@/models/order-ticket/ticket'

/** Creates an empty ticket without assuming a symbol or account environment. */
export function createTicketDraft(): TicketDraft {
  return {
    amount: '1',
    asset: null,
    extendedHours: false,
    limitPrice: '',
    orderClass: 'simple',
    preferOption: false,
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

interface OpenTicketDraftOptions {
  current: TicketDraft
  options: OpenTicketOptions
}

interface OpenedTicketDraft {
  draft: TicketDraft
  /** True when the requested symbol still has to be looked up. */
  needsLookup: boolean
}

/**
 * Applies an open request. Reopening the symbol already on the ticket keeps
 * that draft so a retry can reuse its client order ID.
 */
export function openTicketDraft({
  current,
  options,
}: OpenTicketDraftOptions): OpenedTicketDraft {
  const identifier = options.assetIdentifier?.trim().toLowerCase()
  const matches =
    !options.asset &&
    (!identifier ||
      current.asset?.id.toLowerCase() === identifier ||
      current.asset?.symbol.toLowerCase() === identifier)
  if (matches) {
    if (!options.side || options.side === current.side) {
      return { draft: current, needsLookup: false }
    }
    return {
      draft: reconcileTicket({
        ...current,
        positionIntent:
          options.side === 'buy' ? 'buy_to_open' : 'sell_to_close',
        side: options.side,
      }),
      needsLookup: false,
    }
  }
  const selected = selectTicketAsset({
    asset: options.asset ?? null,
    draft: current,
  })
  const draft = options.side
    ? reconcileTicket({
        ...selected,
        positionIntent:
          options.side === 'buy' ? 'buy_to_open' : 'sell_to_close',
        side: options.side,
      })
    : selected
  return { draft, needsLookup: Boolean(identifier) && !options.asset }
}

interface WithPageAssetOptions {
  current: TicketDraft
  options: OpenTicketOptions
  /** The asset of the screen the trader is on, such as the Trade screen's symbol. */
  pageAsset: TicketAsset | null
}

/**
 * Fills an open request that names no asset with the current screen's asset.
 * A ticket already trading that asset, or an option on it, keeps its draft.
 */
export function withPageAsset({
  current,
  options,
  pageAsset,
}: WithPageAssetOptions): OpenTicketOptions {
  if (!pageAsset || options.asset || options.assetIdentifier?.trim()) {
    return options
  }
  if (getTicketUnderlying(current.asset)?.symbol === pageAsset.symbol) {
    return options
  }
  return { ...options, asset: pageAsset }
}

/** True when the ticket is writing an option or asking for a contract on a stock. */
export function isTicketOptionMode(draft: TicketDraft): boolean {
  if (draft.asset?.assetClass === 'us_option') return true
  return Boolean(
    draft.preferOption &&
      getTicketUnderlying(draft.asset)?.assetClass === 'us_equity'
  )
}

/** True when option mode is on but the draft still holds the underlying stock. */
export function isChoosingTicketContract(draft: TicketDraft): boolean {
  return isTicketOptionMode(draft) && draft.asset?.assetClass !== 'us_option'
}

interface ResolveListedExpirationOptions {
  expiration?: string
  expirations: string[]
  returnedExpiration?: string
}

/**
 * Picks a currently listed expiration. A persisted date the chain no longer
 * offers falls back to the date the API actually returned.
 */
export function resolveListedExpiration({
  expiration,
  expirations,
  returnedExpiration,
}: ResolveListedExpirationOptions): string {
  if (expiration && expirations.includes(expiration)) return expiration
  if (returnedExpiration && expirations.includes(returnedExpiration))
    return returnedExpiration
  return expirations[0] ?? ''
}

/** Returns the stock or crypto being traded, including an option's underlying. */
export function getTicketUnderlying(
  asset: TicketAsset | null
): AssetSearchResult | null {
  if (!asset) return null
  if (asset.assetClass === 'us_option') return asset.underlying ?? null
  return {
    assetClass: asset.assetClass,
    exchange: asset.exchange,
    fractionable: asset.fractionable,
    id: asset.id,
    name: asset.name,
    symbol: asset.symbol,
  }
}

interface OptionTicketAssetOptions {
  contract: OptionContract
  underlying: AssetSearchResult
}

/** Builds the ticket asset for one call or put and remembers the stock behind it. */
export function toOptionTicketAsset({
  contract,
  underlying,
}: OptionTicketAssetOptions): TicketAsset {
  return {
    assetClass: 'us_option',
    exchange: 'OPRA',
    expirationDate: contract.expirationDate,
    fractionable: false,
    id: contract.symbol,
    name: formatOptionName({ contract, underlying: underlying.symbol }),
    optionType: contract.type,
    symbol: contract.symbol,
    underlying,
  }
}

interface FormatOptionNameOptions {
  contract: OptionContract
  underlying: string
}

const optionExpirationFormat = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
  year: 'numeric',
})
const optionStrikeFormat = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
})

/** Renders a contract as readable text, independent of its OCC symbol. */
function formatOptionName({
  contract,
  underlying,
}: FormatOptionNameOptions): string {
  const expiration = optionExpirationFormat.format(
    new Date(`${contract.expirationDate}T00:00:00Z`)
  )
  const strike = optionStrikeFormat.format(contract.strike)
  return `${underlying} ${expiration} ${strike} ${contract.type}`
}
