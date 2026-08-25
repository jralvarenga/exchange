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

export const balanceIntervalSchema = z.enum([
  '1M',
  '1W',
  '1Y',
  '3M',
  'ALL',
  'YTD',
])

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

export const portfolioSchema = z.object({
  positions: z.array(portfolioPositionSchema),
  totalCostBasis: z.number(),
  totalMarketValue: z.number(),
  totalUnrealizedProfitLoss: z.number(),
})

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

export type AlpacaAccount = z.infer<typeof alpacaAccountSchema>
export type AccountSummary = z.infer<typeof accountSummarySchema>
export type AlpacaClientOptions = z.infer<typeof alpacaClientOptionsSchema>
export type AlpacaCryptoSnapshotsResponse = z.infer<
  typeof alpacaCryptoSnapshotsResponseSchema
>
export type AlpacaPortfolioHistory = z.infer<
  typeof alpacaPortfolioHistorySchema
>
export type AlpacaPosition = z.infer<typeof alpacaPositionSchema>
export type BalanceChange = z.infer<typeof balanceChangeSchema>
export type BalanceChanges = z.infer<typeof balanceChangesSchema>
export type BalanceChart = z.infer<typeof balanceChartSchema>
export type BalanceInterval = z.infer<typeof balanceIntervalSchema>
export type CurrentBalance = z.infer<typeof currentBalanceSchema>
export type GetBalanceChartOptions = z.infer<
  typeof getBalanceChartOptionsSchema
>
export type GetCryptoSnapshotsOptions = z.infer<
  typeof getCryptoSnapshotsOptionsSchema
>
export type GetPositionOptions = z.infer<typeof getPositionOptionsSchema>
export type Portfolio = z.infer<typeof portfolioSchema>
export type PortfolioHistoryOptions = z.infer<
  typeof portfolioHistoryOptionsSchema
>
export type PortfolioPosition = z.infer<typeof portfolioPositionSchema>
export type PortfolioTimeframe = z.infer<typeof portfolioTimeframeSchema>
export type TokenPrice = z.infer<typeof tokenPriceSchema>
