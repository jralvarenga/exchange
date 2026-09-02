import { z } from 'zod'

export const alpacaEnvironmentSchema = z.enum(['paper', 'live'])

export const alpacaAssetClassSchema = z.enum([
  'crypto',
  'us_equity',
  'us_option',
])

export const alpacaCryptoLocationSchema = z.enum([
  'bs-1',
  'eu-1',
  'us',
  'us-1',
  'us-2',
])

export const alpacaOrderTypeSchema = z.enum([
  'market',
  'limit',
  'stop',
  'stop_limit',
  'trailing_stop',
])

export const alpacaTimeInForceSchema = z.enum([
  'day',
  'gtc',
  'opg',
  'cls',
  'ioc',
  'fok',
])

export const alpacaQuantityModeSchema = z.enum(['qty', 'notional'])

export const alpacaOrderSideSchema = z.enum(['buy', 'sell'])

export const searchableAssetClassSchema = z.enum(['crypto', 'us_equity'])

export const balanceIntervalSchema = z.enum([
  '1D',
  '1M',
  '1W',
  '1Y',
  '3M',
  'ALL',
  'YTD',
])

export const assetIntervalSchema = z.enum(['1D', '1W', '1M', '3M', '1Y'])

export const portfolioTimeframeSchema = z.enum([
  '1D',
  '1H',
  '1Min',
  '5Min',
  '15Min',
])

export const intradayReportingSchema = z.enum([
  'continuous',
  'extended_hours',
  'market_hours',
])

export const pnlResetSchema = z.enum(['no_reset', 'per_day'])

export const alpacaClientOptionsSchema = z.object({
  apiKeyId: z.string().min(1).optional(),
  apiSecretKey: z.string().min(1).optional(),
  cryptoLocation: alpacaCryptoLocationSchema.optional(),
  dataBaseUrl: z.string().url().optional(),
  fetcher: z
    .custom<typeof fetch>((value) => typeof value === 'function')
    .optional(),
  timeoutMs: z.number().int().positive().optional(),
  tradingBaseUrl: z.string().url().optional(),
})

export const alpacaAssetSchema = z
  .object({
    class: searchableAssetClassSchema,
    exchange: z.string(),
    fractionable: z.boolean(),
    id: z.string(),
    name: z.string(),
    status: z.string(),
    symbol: z.string(),
    tradable: z.boolean(),
  })
  .passthrough()

export const alpacaAssetsSchema = z.array(alpacaAssetSchema)

export const getAssetsOptionsSchema = alpacaClientOptionsSchema.extend({
  assetClass: searchableAssetClassSchema,
})

export const assetSearchResultSchema = z.object({
  assetClass: searchableAssetClassSchema,
  exchange: z.string(),
  fractionable: z.boolean(),
  id: z.string(),
  name: z.string(),
  symbol: z.string(),
})

export const assetSearchResponseSchema = z.object({
  assets: z.array(assetSearchResultSchema),
  query: z.string(),
})

export const assetSearchOptionsSchema = alpacaClientOptionsSchema.extend({
  limit: z.number().int().min(1).max(20).default(8),
  query: z.string().trim().min(1).max(80),
})

export const assetDetailOptionsSchema = alpacaClientOptionsSchema.extend({
  identifier: z.string().trim().min(1).max(120),
})

export const assetHistoryOptionsSchema = assetDetailOptionsSchema.extend({
  interval: assetIntervalSchema,
})

export const assetBarSchema = z.object({
  close: z.number(),
  high: z.number(),
  low: z.number(),
  open: z.number(),
  timestamp: z.string(),
  volume: z.number(),
})

export const assetHistorySchema = z.object({
  bars: z.array(assetBarSchema),
  interval: assetIntervalSchema,
  symbol: z.string(),
})

const positiveDecimalSchema = z
  .string()
  .trim()
  .regex(/^\d+(?:\.\d{1,9})?$/u, 'Enter a valid number with up to 9 decimals.')
  .refine((value) => Number(value) > 0, 'Enter an amount greater than zero.')

const optionalPositiveDecimalSchema = z.union([
  z.literal(''),
  positiveDecimalSchema,
])

export const orderFormValuesSchema = z
  .object({
    amount: positiveDecimalSchema,
    asset: assetSearchResultSchema.nullable(),
    limitPrice: optionalPositiveDecimalSchema,
    quantityMode: alpacaQuantityModeSchema,
    stopPrice: optionalPositiveDecimalSchema,
    timeInForce: alpacaTimeInForceSchema,
    trailPercent: optionalPositiveDecimalSchema,
    type: alpacaOrderTypeSchema,
  })
  .superRefine((values, context) => {
    validateOrderValues(
      {
        ...values,
        assetClass: values.asset?.assetClass,
        fractionable: values.asset?.fractionable,
      },
      context
    )

    if (!values.asset) {
      context.addIssue({
        code: 'custom',
        message: 'Select an asset to place an order.',
        path: ['asset'],
      })
    }
  })

export const createOrderRequestSchema = z
  .object({
    amount: positiveDecimalSchema,
    assetClass: searchableAssetClassSchema,
    clientOrderId: z.uuid().optional(),
    fractionable: z.boolean(),
    limitPrice: optionalPositiveDecimalSchema.optional(),
    quantityMode: alpacaQuantityModeSchema,
    side: alpacaOrderSideSchema,
    stopPrice: optionalPositiveDecimalSchema.optional(),
    symbol: z.string().trim().min(1).max(32),
    timeInForce: alpacaTimeInForceSchema,
    trailPercent: optionalPositiveDecimalSchema.optional(),
    type: alpacaOrderTypeSchema,
  })
  .superRefine(validateOrderValues)

export const alpacaOrderSchema = z
  .object({
    client_order_id: z.string(),
    id: z.string(),
    side: alpacaOrderSideSchema,
    status: z.string(),
    submitted_at: z.string().nullable(),
    symbol: z.string(),
    time_in_force: alpacaTimeInForceSchema,
    type: alpacaOrderTypeSchema,
  })
  .passthrough()

export const orderSchema = z.object({
  clientOrderId: z.string(),
  id: z.string(),
  side: alpacaOrderSideSchema,
  status: z.string(),
  submittedAt: z.string().nullable(),
  symbol: z.string(),
  timeInForce: alpacaTimeInForceSchema,
  type: alpacaOrderTypeSchema,
})

export const orderStatusFilterSchema = z.enum(['all', 'closed', 'open'])

export const sortDirectionSchema = z.enum(['asc', 'desc'])

export const alpacaAccountOrderSchema = alpacaOrderSchema.extend({
  asset_class: alpacaAssetClassSchema.optional(),
  created_at: z.string().optional(),
  filled_avg_price: z.string().nullable().optional(),
  filled_qty: z.string().optional(),
  limit_price: z.string().nullable().optional(),
  notional: z.string().nullable().optional(),
  qty: z.string().nullable().optional(),
  stop_price: z.string().nullable().optional(),
})

export const alpacaAccountOrdersSchema = z.array(alpacaAccountOrderSchema)

export const accountOrderSchema = orderSchema.extend({
  assetClass: alpacaAssetClassSchema.optional(),
  createdAt: z.string().optional(),
  filledAveragePrice: z.string().nullable().optional(),
  filledQuantity: z.string().optional(),
  limitPrice: z.string().nullable().optional(),
  notional: z.string().nullable().optional(),
  quantity: z.string().nullable().optional(),
  stopPrice: z.string().nullable().optional(),
})

export const accountOrdersSchema = z.array(accountOrderSchema)

export const getOrdersOptionsSchema = alpacaClientOptionsSchema.extend({
  beforeOrderId: z.string().min(1).optional(),
  direction: sortDirectionSchema.default('desc'),
  limit: z.number().int().min(1).max(500).default(500),
  nested: z.boolean().default(false),
  status: orderStatusFilterSchema.default('all'),
  symbols: z.array(z.string().trim().min(1)).max(100).optional(),
})

export const alpacaAccountSchema = z
  .object({
    account_blocked: z.boolean(),
    account_number: z.string(),
    accrued_fees: z.string(),
    buying_power: z.string(),
    cash: z.string(),
    created_at: z.string(),
    crypto_status: z.string().optional(),
    currency: z.string(),
    daytrade_count: z.number().optional(),
    equity: z.string(),
    id: z.string(),
    initial_margin: z.string(),
    last_equity: z.string(),
    long_market_value: z.string(),
    maintenance_margin: z.string(),
    multiplier: z.string(),
    non_marginable_buying_power: z.string(),
    options_approved_level: z.number().optional(),
    options_buying_power: z.string().optional(),
    options_trading_level: z.number().optional(),
    pattern_day_trader: z.boolean().optional(),
    pending_transfer_in: z.string().optional(),
    pending_transfer_out: z.string().optional(),
    portfolio_value: z.string(),
    regt_buying_power: z.string(),
    short_market_value: z.string(),
    shorting_enabled: z.boolean(),
    sma: z.string(),
    status: z.string(),
    trade_suspended_by_user: z.boolean(),
    trading_blocked: z.boolean(),
    transfers_blocked: z.boolean(),
  })
  .passthrough()

export const currentBalanceSchema = z.object({
  buyingPower: z.number(),
  cash: z.number(),
  currency: z.string(),
  equity: z.number(),
  lastEquity: z.number(),
  portfolioValue: z.number(),
  todayChange: z.number(),
  todayChangePercent: z.number(),
})

export const accountSummarySchema = z.object({
  accountBlocked: z.boolean(),
  cryptoStatus: z.string().optional(),
  currency: z.string(),
  status: z.string(),
  tradingBlocked: z.boolean(),
  transfersBlocked: z.boolean(),
})

export const alpacaPositionSchema = z
  .object({
    asset_class: alpacaAssetClassSchema,
    asset_id: z.string(),
    asset_marginable: z.boolean().optional(),
    avg_entry_price: z.string(),
    change_today: z.string(),
    cost_basis: z.string(),
    current_price: z.string(),
    exchange: z.string(),
    lastday_price: z.string(),
    market_value: z.string(),
    qty: z.string(),
    qty_available: z.string().optional(),
    side: z.enum(['long', 'short']),
    symbol: z.string(),
    unrealized_intraday_pl: z.string(),
    unrealized_intraday_plpc: z.string(),
    unrealized_pl: z.string(),
    unrealized_plpc: z.string(),
  })
  .passthrough()

export const alpacaPositionsSchema = z.array(alpacaPositionSchema)

export const portfolioPositionSchema = z.object({
  assetClass: alpacaAssetClassSchema,
  assetId: z.string(),
  averageEntryPrice: z.number(),
  changeTodayPercent: z.number(),
  costBasis: z.number(),
  currentPrice: z.number(),
  marketValue: z.number(),
  quantity: z.number(),
  side: z.enum(['long', 'short']),
  symbol: z.string(),
  unrealizedProfitLoss: z.number(),
  unrealizedProfitLossPercent: z.number(),
})

export const assetDetailSchema = z.object({
  asset: assetSearchResultSchema,
  change: z.number(),
  changePercent: z.number(),
  currency: z.literal('USD'),
  position: portfolioPositionSchema.nullable(),
  price: z.number(),
  updatedAt: z.string(),
})

export const portfolioSchema = z.object({
  positions: z.array(portfolioPositionSchema),
  totalCostBasis: z.number(),
  totalMarketValue: z.number(),
  totalUnrealizedProfitLoss: z.number(),
})

export const ordersAndPositionsSchema = z.object({
  orders: accountOrdersSchema,
  portfolio: portfolioSchema,
})

export const activityCategorySchema = z.enum([
  'non_trade_activity',
  'trade_activity',
])

export const alpacaAccountActivitySchema = z
  .object({
    activity_type: z.string(),
    cum_qty: z.string().optional(),
    date: z.string().optional(),
    id: z.string(),
    leaves_qty: z.string().optional(),
    net_amount: z.string().optional(),
    order_id: z.string().optional(),
    per_share_amount: z.string().optional(),
    price: z.string().optional(),
    qty: z.string().optional(),
    side: alpacaOrderSideSchema.optional(),
    symbol: z.string().optional(),
    transaction_time: z.string().optional(),
    type: z.string().optional(),
  })
  .passthrough()

export const alpacaAccountActivitiesSchema = z.array(
  alpacaAccountActivitySchema
)

export const accountActivitySchema = z.object({
  activityType: z.string(),
  cumulativeQuantity: z.string().optional(),
  date: z.string().optional(),
  id: z.string(),
  leavesQuantity: z.string().optional(),
  netAmount: z.string().optional(),
  orderId: z.string().optional(),
  perShareAmount: z.string().optional(),
  price: z.string().optional(),
  quantity: z.string().optional(),
  side: alpacaOrderSideSchema.optional(),
  symbol: z.string().optional(),
  transactionTime: z.string().optional(),
  type: z.string().optional(),
})

export const accountActivitiesSchema = z.object({
  activities: z.array(accountActivitySchema),
  nextPageToken: z.string().optional(),
})

export const getAccountActivitiesOptionsSchema = alpacaClientOptionsSchema
  .extend({
    activityTypes: z.array(z.string().trim().min(1)).max(50).optional(),
    after: z.string().trim().min(1).max(40).optional(),
    category: activityCategorySchema.optional(),
    date: z.string().trim().min(1).max(40).optional(),
    direction: sortDirectionSchema.default('desc'),
    orderId: z.string().trim().min(1).optional(),
    pageSize: z.number().int().min(1).max(100).default(100),
    pageToken: z.string().trim().min(1).optional(),
    until: z.string().trim().min(1).max(40).optional(),
  })
  .refine(
    (options) => !(options.activityTypes && options.category),
    'Use either activityTypes or category, not both.'
  )

export const portfolioHistoryOptionsSchema = alpacaClientOptionsSchema.extend({
  cashflowTypes: z.string().optional(),
  end: z.union([z.date(), z.string()]).optional(),
  intradayReporting: intradayReportingSchema.optional(),
  period: z.string().optional(),
  pnlReset: pnlResetSchema.optional(),
  start: z.union([z.date(), z.string()]).optional(),
  timeframe: portfolioTimeframeSchema.optional(),
})

export const alpacaPortfolioHistorySchema = z
  .object({
    base_value: z.number().nullable(),
    base_value_asof: z.string().optional(),
    equity: z.array(z.number().nullable()),
    profit_loss: z.array(z.number().nullable()),
    profit_loss_pct: z.array(z.number().nullable()),
    timeframe: z.string(),
    timestamp: z.array(z.number()),
  })
  .passthrough()

export const getBalanceChartOptionsSchema = alpacaClientOptionsSchema.extend({
  interval: balanceIntervalSchema,
})

export const balanceChartPointSchema = z.object({
  equity: z.number().nullable(),
  profitLoss: z.number().nullable(),
  profitLossPercent: z.number().nullable(),
  timestamp: z.string(),
  timestampUnix: z.number(),
})

export const balanceChartSchema = z.object({
  baseValue: z.number().nullable(),
  baseValueAsOf: z.string().optional(),
  interval: balanceIntervalSchema,
  points: z.array(balanceChartPointSchema),
  timeframe: z.string(),
})

export const balanceChangeSchema = z.object({
  amount: z.number(),
  currency: z.string(),
  endEquity: z.number(),
  percent: z.number(),
  startEquity: z.number(),
})

export const balanceChangesSchema = z.object({
  allTime: balanceChangeSchema,
  oneDay: balanceChangeSchema,
  oneMonth: balanceChangeSchema,
  oneWeek: balanceChangeSchema,
  oneYear: balanceChangeSchema,
  threeMonths: balanceChangeSchema,
  yearToDate: balanceChangeSchema,
})

export const getPositionOptionsSchema = alpacaClientOptionsSchema.extend({
  symbolOrAssetId: z.string().min(1),
})

export const getCryptoSnapshotsOptionsSchema = alpacaClientOptionsSchema.extend(
  {
    location: alpacaCryptoLocationSchema.optional(),
    symbols: z.array(z.string().min(1)),
  }
)

export const alpacaCryptoTradeSchema = z
  .object({
    i: z.number(),
    p: z.number(),
    s: z.number(),
    t: z.string(),
    tks: z.string().optional(),
    x: z.string().optional(),
  })
  .passthrough()

export const alpacaCryptoQuoteSchema = z
  .object({
    ap: z.number(),
    as: z.number(),
    bp: z.number(),
    bs: z.number(),
    t: z.string(),
  })
  .passthrough()

export const alpacaCryptoBarSchema = z
  .object({
    c: z.number(),
    h: z.number(),
    l: z.number(),
    n: z.number(),
    o: z.number(),
    t: z.string(),
    v: z.number(),
    vw: z.number(),
  })
  .passthrough()

export const alpacaCryptoSnapshotSchema = z
  .object({
    dailyBar: alpacaCryptoBarSchema.optional(),
    latestQuote: alpacaCryptoQuoteSchema.optional(),
    latestTrade: alpacaCryptoTradeSchema.optional(),
    minuteBar: alpacaCryptoBarSchema.optional(),
    prevDailyBar: alpacaCryptoBarSchema.optional(),
  })
  .passthrough()

export const alpacaStockSnapshotSchema = z.looseObject({
  dailyBar: alpacaCryptoBarSchema.optional(),
  latestQuote: alpacaCryptoQuoteSchema.optional(),
  latestTrade: alpacaCryptoTradeSchema.optional(),
  minuteBar: alpacaCryptoBarSchema.optional(),
  prevDailyBar: alpacaCryptoBarSchema.optional(),
})

export const alpacaStockBarsResponseSchema = z.looseObject({
  bars: z.array(alpacaCryptoBarSchema).nullable(),
  next_page_token: z.string().nullable().optional(),
  symbol: z.string().optional(),
})

export const alpacaCryptoBarsResponseSchema = z.looseObject({
  bars: z.record(z.string(), z.array(alpacaCryptoBarSchema)).nullable(),
  next_page_token: z.string().nullable().optional(),
})

export const alpacaCryptoSnapshotsResponseSchema = z
  .object({
    snapshots: z.record(z.string(), alpacaCryptoSnapshotSchema),
  })
  .passthrough()

export const tokenPriceSchema = z.object({
  askPrice: z.number().optional(),
  bidPrice: z.number().optional(),
  price: z.number(),
  symbol: z.string(),
  timestamp: z.string().optional(),
})

export const tokenPricesSchema = z.array(tokenPriceSchema)

export const balanceHistoryQuerySchema = z.object({
  interval: z.preprocess(
    (value) => (value === null ? undefined : value),
    balanceIntervalSchema.default('1M')
  ),
})

export const cryptoSymbolsQuerySchema = z.object({
  location: z.preprocess(
    (value) => (value === null ? undefined : value),
    alpacaCryptoLocationSchema.optional()
  ),
  symbols: z
    .string()
    .transform((value) =>
      value
        .split(',')
        .map((symbol) => symbol.trim())
        .filter(Boolean)
    )
    .pipe(z.array(z.string().min(1)).min(1).max(100)),
})

export const assetSearchQuerySchema = z.object({
  limit: z.preprocess(
    (value) => (value === null ? undefined : value),
    z.coerce.number().int().min(1).max(20).default(8)
  ),
  query: z.string().trim().min(1).max(80),
})

export const assetDetailQuerySchema = z.object({
  identifier: z.string().trim().min(1).max(120),
})

export const assetHistoryQuerySchema = assetDetailQuerySchema.extend({
  interval: z.preprocess(
    (value) => (value === null ? undefined : value),
    assetIntervalSchema.default('1D')
  ),
})

export const ordersAndPositionsQuerySchema = z.object({
  beforeOrderId: z.preprocess(
    (value) => (value === null || value === '' ? undefined : value),
    z.string().min(1).optional()
  ),
  direction: z.preprocess(
    (value) => (value === null ? undefined : value),
    sortDirectionSchema.default('desc')
  ),
  limit: z.preprocess(
    (value) => (value === null ? undefined : value),
    z.coerce.number().int().min(1).max(500).default(500)
  ),
  nested: z.preprocess(
    (value) => (value === null ? undefined : value),
    z
      .enum(['false', 'true'])
      .transform((value) => value === 'true')
      .default(false)
  ),
  status: z.preprocess(
    (value) => (value === null ? undefined : value),
    orderStatusFilterSchema.default('all')
  ),
  symbols: z.preprocess(
    (value) => (value === null || value === '' ? undefined : value),
    z
      .string()
      .transform((value) =>
        value
          .split(',')
          .map((symbol) => symbol.trim())
          .filter(Boolean)
      )
      .pipe(z.array(z.string().min(1)).max(100))
      .optional()
  ),
})

export const accountActivitiesQuerySchema = z
  .object({
    activityTypes: z.preprocess(
      (value) => (value === null || value === '' ? undefined : value),
      z
        .string()
        .transform((value) =>
          value
            .split(',')
            .map((activityType) => activityType.trim())
            .filter(Boolean)
        )
        .pipe(z.array(z.string().min(1)).max(50))
        .optional()
    ),
    after: z.preprocess(
      (value) => (value === null || value === '' ? undefined : value),
      z.string().trim().min(1).max(40).optional()
    ),
    category: z.preprocess(
      (value) => (value === null || value === '' ? undefined : value),
      activityCategorySchema.optional()
    ),
    date: z.preprocess(
      (value) => (value === null || value === '' ? undefined : value),
      z.string().trim().min(1).max(40).optional()
    ),
    direction: z.preprocess(
      (value) => (value === null ? undefined : value),
      sortDirectionSchema.default('desc')
    ),
    orderId: z.preprocess(
      (value) => (value === null || value === '' ? undefined : value),
      z.string().trim().min(1).optional()
    ),
    pageSize: z.preprocess(
      (value) => (value === null ? undefined : value),
      z.coerce.number().int().min(1).max(100).default(100)
    ),
    pageToken: z.preprocess(
      (value) => (value === null || value === '' ? undefined : value),
      z.string().trim().min(1).optional()
    ),
    until: z.preprocess(
      (value) => (value === null || value === '' ? undefined : value),
      z.string().trim().min(1).max(40).optional()
    ),
  })
  .refine(
    (query) => !(query.activityTypes && query.category),
    'Use either activityTypes or category, not both.'
  )

interface OrderValidationValues {
  amount: string
  assetClass?: z.infer<typeof searchableAssetClassSchema>
  fractionable?: boolean
  limitPrice?: string
  quantityMode: z.infer<typeof alpacaQuantityModeSchema>
  stopPrice?: string
  timeInForce: z.infer<typeof alpacaTimeInForceSchema>
  trailPercent?: string
  type: z.infer<typeof alpacaOrderTypeSchema>
}

/** Adds cross-field issues for Alpaca order combinations it cannot accept. */
function validateOrderValues(
  values: OrderValidationValues,
  context: z.RefinementCtx
): void {
  if (
    (values.type === 'limit' || values.type === 'stop_limit') &&
    !values.limitPrice
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Enter a limit price for this order type.',
      path: ['limitPrice'],
    })
  }

  if (
    (values.type === 'stop' || values.type === 'stop_limit') &&
    !values.stopPrice
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Enter a stop price for this order type.',
      path: ['stopPrice'],
    })
  }

  if (values.type === 'trailing_stop' && !values.trailPercent) {
    context.addIssue({
      code: 'custom',
      message: 'Enter a trailing percentage.',
      path: ['trailPercent'],
    })
  }

  if (
    values.assetClass === 'crypto' &&
    !['market', 'limit', 'stop_limit'].includes(values.type)
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Crypto supports market, limit, and stop-limit orders.',
      path: ['type'],
    })
  }

  if (
    values.assetClass === 'crypto' &&
    !['gtc', 'ioc'].includes(values.timeInForce)
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Crypto orders must use GTC or IOC.',
      path: ['timeInForce'],
    })
  }

  if (
    values.assetClass === 'us_equity' &&
    (values.quantityMode === 'notional' || !isWholeDecimal(values.amount)) &&
    values.timeInForce !== 'day'
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Fractional equity orders must use DAY.',
      path: ['timeInForce'],
    })
  }

  if (
    values.assetClass === 'us_equity' &&
    values.fractionable === false &&
    (values.quantityMode === 'notional' || !isWholeDecimal(values.amount))
  ) {
    context.addIssue({
      code: 'custom',
      message: 'This asset only accepts whole-share quantities.',
      path: ['amount'],
    })
  }

  if (
    ['ioc', 'fok', 'opg', 'cls'].includes(values.timeInForce) &&
    !['market', 'limit'].includes(values.type)
  ) {
    context.addIssue({
      code: 'custom',
      message: 'This time in force only supports market or limit orders.',
      path: ['timeInForce'],
    })
  }
}

/** Returns whether a decimal string represents a whole quantity. */
function isWholeDecimal(value: string): boolean {
  const decimals = value.split('.')[1]

  return decimals === undefined || /^0+$/u.test(decimals)
}

export type AlpacaAccount = z.infer<typeof alpacaAccountSchema>
export type AccountActivities = z.infer<typeof accountActivitiesSchema>
export type AccountActivity = z.infer<typeof accountActivitySchema>
export type AccountOrder = z.infer<typeof accountOrderSchema>
export type AccountSummary = z.infer<typeof accountSummarySchema>
export type AlpacaAccountActivity = z.infer<typeof alpacaAccountActivitySchema>
export type AlpacaAccountOrder = z.infer<typeof alpacaAccountOrderSchema>
export type AlpacaAsset = z.infer<typeof alpacaAssetSchema>
export type AlpacaClientOptions = z.infer<typeof alpacaClientOptionsSchema>
export type AlpacaCryptoSnapshotsResponse = z.infer<
  typeof alpacaCryptoSnapshotsResponseSchema
>
export type AlpacaPortfolioHistory = z.infer<
  typeof alpacaPortfolioHistorySchema
>
export type AlpacaPosition = z.infer<typeof alpacaPositionSchema>
export type AlpacaOrderType = z.infer<typeof alpacaOrderTypeSchema>
export type AlpacaOrder = z.infer<typeof alpacaOrderSchema>
export type AlpacaOrderSide = z.infer<typeof alpacaOrderSideSchema>
export type AlpacaQuantityMode = z.infer<typeof alpacaQuantityModeSchema>
export type AlpacaTimeInForce = z.infer<typeof alpacaTimeInForceSchema>
export type AssetSearchOptions = z.infer<typeof assetSearchOptionsSchema>
export type AssetSearchResponse = z.infer<typeof assetSearchResponseSchema>
export type AssetSearchResult = z.infer<typeof assetSearchResultSchema>
export type AssetBar = z.infer<typeof assetBarSchema>
export type AssetDetail = z.infer<typeof assetDetailSchema>
export type AssetDetailOptions = z.infer<typeof assetDetailOptionsSchema>
export type AssetHistory = z.infer<typeof assetHistorySchema>
export type AssetHistoryOptions = z.infer<typeof assetHistoryOptionsSchema>
export type AssetInterval = z.infer<typeof assetIntervalSchema>
export type BalanceChange = z.infer<typeof balanceChangeSchema>
export type BalanceChanges = z.infer<typeof balanceChangesSchema>
export type BalanceChart = z.infer<typeof balanceChartSchema>
export type BalanceInterval = z.infer<typeof balanceIntervalSchema>
export type CurrentBalance = z.infer<typeof currentBalanceSchema>
export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>
export type GetBalanceChartOptions = z.infer<
  typeof getBalanceChartOptionsSchema
>
export type GetAccountActivitiesOptions = z.infer<
  typeof getAccountActivitiesOptionsSchema
>
export type GetCryptoSnapshotsOptions = z.infer<
  typeof getCryptoSnapshotsOptionsSchema
>
export type GetAssetsOptions = z.infer<typeof getAssetsOptionsSchema>
export type GetPositionOptions = z.infer<typeof getPositionOptionsSchema>
export type GetOrdersOptions = z.infer<typeof getOrdersOptionsSchema>
export type Portfolio = z.infer<typeof portfolioSchema>
export type PortfolioHistoryOptions = z.infer<
  typeof portfolioHistoryOptionsSchema
>
export type PortfolioPosition = z.infer<typeof portfolioPositionSchema>
export type PortfolioTimeframe = z.infer<typeof portfolioTimeframeSchema>
export type Order = z.infer<typeof orderSchema>
export type OrderFormValues = z.infer<typeof orderFormValuesSchema>
export type OrdersAndPositions = z.infer<typeof ordersAndPositionsSchema>
export type TokenPrice = z.infer<typeof tokenPriceSchema>
