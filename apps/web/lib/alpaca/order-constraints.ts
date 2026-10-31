import type {
  AlpacaOrderClass,
  AlpacaOrderType,
  AlpacaQuantityMode,
  AlpacaTimeInForce,
} from '@/lib/alpaca/schemas'

type OrderAssetClass = 'crypto' | 'us_equity' | 'us_option'

interface GetAllowedTimesInForceOptions {
  amount: string
  assetClass?: OrderAssetClass
  orderClass?: AlpacaOrderClass
  quantityMode: AlpacaQuantityMode
  type: AlpacaOrderType
}

interface GetCompatibleOrderSettingsOptions
  extends GetAllowedTimesInForceOptions {
  timeInForce: AlpacaTimeInForce
}

interface CompatibleOrderSettings {
  orderClass: AlpacaOrderClass
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
const optionOrderTypes: AlpacaOrderType[] = [
  'market',
  'limit',
  'stop',
  'stop_limit',
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

/** Returns the order types Alpaca accepts for an asset class and order class. */
export function getAllowedOrderTypes(
  assetClass: OrderAssetClass = 'us_equity',
  orderClass: AlpacaOrderClass = 'simple'
): AlpacaOrderType[] {
  if (assetClass === 'crypto') {
    return cryptoOrderTypes
  }

  if (assetClass === 'us_option') {
    return optionOrderTypes
  }

  if (orderClass === 'bracket') {
    return ['market', 'limit']
  }

  if (orderClass === 'oco') {
    return ['limit']
  }

  return equityOrderTypes
}

/** Returns the order classes Alpaca accepts for an asset class. */
export function getAllowedOrderClasses(
  assetClass: OrderAssetClass = 'us_equity'
): AlpacaOrderClass[] {
  return assetClass === 'us_equity'
    ? ['simple', 'bracket', 'oco', 'oto']
    : ['simple']
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

  if (options.assetClass === 'us_option') {
    return ['day']
  }

  if (
    options.assetClass === 'us_equity' &&
    isFractionalQuantity(options.amount, options.quantityMode)
  ) {
    return ['day']
  }

  if (options.orderClass && options.orderClass !== 'simple') {
    return ['day', 'gtc']
  }

  if (options.type !== 'market' && options.type !== 'limit') {
    return ['day', 'gtc']
  }

  return equityTimesInForce
}

/** Returns order class, type, and time-in-force values Alpaca will accept together. */
export function getCompatibleOrderSettings(
  options: GetCompatibleOrderSettingsOptions
): CompatibleOrderSettings {
  const fractional = isFractionalQuantity(options.amount, options.quantityMode)
  const allowedClasses = getAllowedOrderClasses(options.assetClass)
  const requestedClass = fractional ? 'simple' : options.orderClass
  const orderClass =
    requestedClass && allowedClasses.includes(requestedClass)
      ? requestedClass
      : 'simple'
  const allowedTypes = getAllowedOrderTypes(options.assetClass, orderClass)
  const type = allowedTypes.includes(options.type)
    ? options.type
    : (allowedTypes[0] ?? 'market')
  const allowedTimesInForce = getAllowedTimesInForce({
    ...options,
    orderClass,
    type,
  })
  const timeInForce = allowedTimesInForce.includes(options.timeInForce)
    ? options.timeInForce
    : (allowedTimesInForce[0] ?? 'day')

  return { orderClass, timeInForce, type }
}

/** Returns whether the quantity must be treated as a fractional order. */
export function isFractionalQuantity(
  amount: string,
  quantityMode: AlpacaQuantityMode
): boolean {
  if (quantityMode === 'notional') {
    return true
  }

  const decimals = amount.split('.')[1]

  return decimals !== undefined && !/^0+$/u.test(decimals)
}
