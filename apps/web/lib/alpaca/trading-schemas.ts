import { z } from 'zod'

import { alpacaAssetClassSchema, alpacaClientOptionsSchema } from './schemas'

export const marketSessionSchema = z.enum(['open', 'extended', 'closed'])

export const alpacaClockSchema = z.looseObject({
  is_open: z.boolean(),
  next_close: z.string(),
  next_open: z.string(),
  timestamp: z.string(),
})

export const alpacaCalendarDaySchema = z.looseObject({
  close: z.string(),
  date: z.string(),
  open: z.string(),
  session_close: z.string().optional(),
  session_open: z.string().optional(),
})

export const alpacaCalendarSchema = z.array(alpacaCalendarDaySchema)

export const marketClockSchema = z.object({
  isOpen: z.boolean(),
  nextClose: z.string(),
  nextOpen: z.string(),
  session: marketSessionSchema,
  timestamp: z.string(),
})

export const calendarDaySchema = z.object({
  close: z.string(),
  date: z.string(),
  open: z.string(),
  sessionClose: z.string().optional(),
  sessionOpen: z.string().optional(),
})

export const calendarSchema = z.array(calendarDaySchema)

export const calendarQuerySchema = z.object({
  end: z.preprocess(
    (value) => (value === null || value === '' ? undefined : value),
    z.iso.date().optional()
  ),
  start: z.preprocess(
    (value) => (value === null || value === '' ? undefined : value),
    z.iso.date().optional()
  ),
})

export const accountOverviewSchema = z.object({
  accountBlocked: z.boolean(),
  accountNumberLast4: z.string(),
  accruedFees: z.number(),
  buyingPower: z.number(),
  cash: z.number(),
  createdAt: z.string(),
  cryptoStatus: z.string().optional(),
  currency: z.string(),
  daytradeCount: z.number(),
  daytradingBuyingPower: z.number().optional(),
  equity: z.number(),
  initialMargin: z.number(),
  lastEquity: z.number(),
  longMarketValue: z.number(),
  maintenanceMargin: z.number(),
  multiplier: z.number(),
  nonMarginableBuyingPower: z.number(),
  optionsApprovedLevel: z.number().optional(),
  optionsBuyingPower: z.number().optional(),
  optionsTradingLevel: z.number().optional(),
  patternDayTrader: z.boolean(),
  pendingTransferIn: z.number().optional(),
  regtBuyingPower: z.number(),
  shortMarketValue: z.number(),
  shortingEnabled: z.boolean(),
  status: z.string(),
  tradeSuspendedByUser: z.boolean(),
  tradingBlocked: z.boolean(),
  transfersBlocked: z.boolean(),
})

const dayTradeCheckSchema = z.enum(['both', 'entry', 'exit'])

export const alpacaAccountConfigurationsSchema = z.looseObject({
  // Alpaca removed dtbp_check and pdt_check. Older responses may still send them.
  dtbp_check: dayTradeCheckSchema.optional(),
  fractional_trading: z.boolean(),
  max_margin_multiplier: z.string(),
  max_options_trading_level: z.number().optional(),
  no_shorting: z.boolean(),
  pdt_check: dayTradeCheckSchema.optional(),
  suspend_trade: z.boolean(),
  trade_confirm_email: z.enum(['all', 'none']),
})

export const accountConfigurationsSchema = z.object({
  dayTradeBuyingPowerCheck: dayTradeCheckSchema.optional(),
  fractionalTrading: z.boolean(),
  maxMarginMultiplier: z.enum(['1', '2', '4']),
  maxOptionsTradingLevel: z.number().int().min(0).max(3).optional(),
  noShorting: z.boolean(),
  patternDayTraderCheck: dayTradeCheckSchema.optional(),
  suspendTrade: z.boolean(),
  tradeConfirmEmail: z.enum(['all', 'none']),
})

export const updateAccountConfigurationsSchema = accountConfigurationsSchema
  .omit({
    dayTradeBuyingPowerCheck: true,
    patternDayTraderCheck: true,
  })
  .partial()
  .refine(
    (values) => Object.values(values).some((value) => value !== undefined),
    'Change at least one account configuration.'
  )

export const alpacaWatchlistAssetSchema = z.looseObject({
  class: alpacaAssetClassSchema.or(z.string()),
  id: z.string(),
  name: z.string().optional(),
  symbol: z.string(),
})

export const alpacaWatchlistSchema = z.looseObject({
  assets: z.array(alpacaWatchlistAssetSchema).nullable().optional(),
  created_at: z.string(),
  id: z.string(),
  name: z.string(),
  updated_at: z.string(),
})

export const alpacaWatchlistsSchema = z.array(alpacaWatchlistSchema)

export const watchlistAssetSchema = z.object({
  assetClass: z.string(),
  id: z.string(),
  name: z.string(),
  symbol: z.string(),
})

export const watchlistSchema = z.object({
  assets: z.array(watchlistAssetSchema),
  createdAt: z.string(),
  id: z.string(),
  name: z.string(),
  updatedAt: z.string(),
})

export const watchlistsSchema = z.array(watchlistSchema)

const watchlistNameSchema = z.string().trim().min(1).max(64)
const watchlistSymbolSchema = z.string().trim().min(1).max(32)

export const createWatchlistRequestSchema = z.object({
  name: watchlistNameSchema,
  symbols: z.array(watchlistSymbolSchema).max(200).default([]),
})

export const updateWatchlistRequestSchema = z
  .object({
    name: watchlistNameSchema.optional(),
    symbols: z.array(watchlistSymbolSchema).max(200).optional(),
  })
  .refine(
    (values) => values.name !== undefined || values.symbols !== undefined,
    'Provide a name or symbols to update the watchlist.'
  )

export const watchlistSymbolRequestSchema = z.object({
  symbol: watchlistSymbolSchema,
})

export const closePositionRequestSchema = z
  .object({
    percentage: z.preprocess(
      (value) => (value === null || value === '' ? undefined : value),
      z.coerce.number().gt(0).max(100).optional()
    ),
    quantity: z.preprocess(
      (value) => (value === null || value === '' ? undefined : value),
      z
        .string()
        .regex(/^\d+(?:\.\d{1,9})?$/u)
        .refine(
          (value) => Number(value) > 0,
          'Enter a quantity greater than zero.'
        )
        .optional()
    ),
  })
  .refine(
    (values) => !(values.percentage && values.quantity),
    'Close by quantity or percentage, not both.'
  )

export const bulkResultSchema = z.object({
  failed: z.number(),
  succeeded: z.number(),
})

export const alpacaBulkResponseSchema = z
  .array(z.looseObject({ status: z.number() }))
  .nullable()

export const corporateActionTypeSchema = z.enum([
  'dividend',
  'merger',
  'spinoff',
  'split',
])

export const alpacaAnnouncementSchema = z.looseObject({
  ca_sub_type: z.string(),
  ca_type: z.string(),
  cash: z.string().nullable().optional(),
  declaration_date: z.string().nullable().optional(),
  ex_date: z.string().nullable().optional(),
  id: z.string(),
  initiating_symbol: z.string().nullable().optional(),
  new_rate: z.string().nullable().optional(),
  old_rate: z.string().nullable().optional(),
  payable_date: z.string().nullable().optional(),
  record_date: z.string().nullable().optional(),
  target_symbol: z.string().nullable().optional(),
})

export const alpacaAnnouncementsSchema = z.array(alpacaAnnouncementSchema)

export const corporateActionSchema = z.object({
  cash: z.number().optional(),
  declarationDate: z.string().optional(),
  exDate: z.string().optional(),
  id: z.string(),
  newRate: z.number().optional(),
  oldRate: z.number().optional(),
  payableDate: z.string().optional(),
  recordDate: z.string().optional(),
  subType: z.string(),
  symbol: z.string(),
  targetSymbol: z.string().optional(),
  type: z.string(),
})

export const corporateActionsSchema = z.array(corporateActionSchema)

export const corporateActionsQuerySchema = z.object({
  symbol: z.preprocess(
    (value) => (value === null || value === '' ? undefined : value),
    z.string().trim().min(1).max(32).optional()
  ),
  types: z.preprocess(
    (value) => (value === null || value === '' ? undefined : value),
    z
      .string()
      .transform((value) =>
        value
          .split(',')
          .map((type) => type.trim())
          .filter(Boolean)
      )
      .pipe(z.array(corporateActionTypeSchema).min(1))
      .optional()
  ),
})

export const getCorporateActionsOptionsSchema =
  alpacaClientOptionsSchema.extend({
    symbol: z.string().optional(),
    types: z.array(corporateActionTypeSchema).optional(),
  })

export type AccountConfigurations = z.infer<typeof accountConfigurationsSchema>
export type AccountOverview = z.infer<typeof accountOverviewSchema>
export type AlpacaWatchlist = z.infer<typeof alpacaWatchlistSchema>
export type BulkResult = z.infer<typeof bulkResultSchema>
export type CalendarDay = z.infer<typeof calendarDaySchema>
export type ClosePositionRequest = z.infer<typeof closePositionRequestSchema>
export type CorporateAction = z.infer<typeof corporateActionSchema>
export type CorporateActionType = z.infer<typeof corporateActionTypeSchema>
export type CreateWatchlistRequest = z.input<
  typeof createWatchlistRequestSchema
>
export type GetCorporateActionsOptions = z.infer<
  typeof getCorporateActionsOptionsSchema
>
export type MarketClock = z.infer<typeof marketClockSchema>
export type MarketSession = z.infer<typeof marketSessionSchema>
export type UpdateAccountConfigurations = z.infer<
  typeof updateAccountConfigurationsSchema
>
export type UpdateWatchlistRequest = z.infer<
  typeof updateWatchlistRequestSchema
>
export type Watchlist = z.infer<typeof watchlistSchema>
