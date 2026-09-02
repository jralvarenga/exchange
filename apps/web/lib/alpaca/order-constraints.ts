import type {
  AlpacaOrderType,
  AlpacaQuantityMode,
  AlpacaTimeInForce,
  AssetSearchResult,
} from '@/lib/alpaca/schemas'

interface GetAllowedTimesInForceOptions {
  amount: string
  assetClass?: AssetSearchResult['assetClass']
  quantityMode: AlpacaQuantityMode
  type: AlpacaOrderType
}

interface GetCompatibleOrderSettingsOptions
  extends GetAllowedTimesInForceOptions {
  timeInForce: AlpacaTimeInForce
}

interface CompatibleOrderSettings {
  timeInForce: AlpacaTimeInForce
  type: AlpacaOrderType
}

const equityOrderTypes: AlpacaOrderType[] = [
  'market',
  'limit',
  'stop',
  'stop_limit',
  'trailing_stop',
]
const cryptoOrderTypes: AlpacaOrderType[] = ['market', 'limit', 'stop_limit']
const equityTimesInForce: AlpacaTimeInForce[] = [
  'day',
  'gtc',
  'opg',
  'cls',
  'ioc',
  'fok',
]
const cryptoTimesInForce: AlpacaTimeInForce[] = ['gtc', 'ioc']

/** Returns the order types Alpaca accepts for the selected asset class. */
export function getAllowedOrderTypes(
  assetClass?: AssetSearchResult['assetClass']
): AlpacaOrderType[] {
  if (assetClass === 'crypto') {
    return cryptoOrderTypes
  }

  return equityOrderTypes
}

/** Returns the time-in-force values Alpaca accepts for these order settings. */
export function getAllowedTimesInForce(
  options: GetAllowedTimesInForceOptions
): AlpacaTimeInForce[] {
  if (options.assetClass === 'crypto') {
    if (options.type === 'market' || options.type === 'limit') {
      return cryptoTimesInForce
    }

    return ['gtc']
  }

  if (
    options.assetClass === 'us_equity' &&
    isFractionalQuantity(options.amount, options.quantityMode)
  ) {
    return ['day']
  }

  return equityTimesInForce
}

/** Returns type and time-in-force values that Alpaca will accept together. */
export function getCompatibleOrderSettings(
  options: GetCompatibleOrderSettingsOptions
): CompatibleOrderSettings {
  const allowedTypes = getAllowedOrderTypes(options.assetClass)
  const type = allowedTypes.includes(options.type)
    ? options.type
    : (allowedTypes[0] ?? 'market')
  const allowedTimesInForce = getAllowedTimesInForce({
    amount: options.amount,
    assetClass: options.assetClass,
    quantityMode: options.quantityMode,
    type,
  })
  const timeInForce = allowedTimesInForce.includes(options.timeInForce)
    ? options.timeInForce
    : (allowedTimesInForce[0] ?? 'gtc')

  return {
    timeInForce,
    type,
  }
}

/** Returns whether the quantity must be treated as a fractional equity order. */
function isFractionalQuantity(
  amount: string,
  quantityMode: AlpacaQuantityMode
): boolean {
  if (quantityMode === 'notional') {
    return true
  }

  const decimals = amount.split('.')[1]

  return decimals !== undefined && !/^0+$/u.test(decimals)
}
