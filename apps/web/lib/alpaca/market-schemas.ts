import { z } from 'zod'

/** Treats a missing or empty search param as undefined before validating it. */
function optionalQueryString<Schema extends z.ZodType>(schema: Schema) {
  return z.preprocess(
    (value) => (value === null || value === '' ? undefined : value),
    schema.optional()
  )
}

export const alpacaNewsArticleSchema = z.looseObject({
  author: z.string().optional(),
  created_at: z.string(),
  headline: z.string(),
  id: z.number(),
  images: z
    .array(z.looseObject({ size: z.string(), url: z.string() }))
    .optional(),
  source: z.string().optional(),
  summary: z.string().optional(),
  symbols: z.array(z.string()).optional(),
  url: z.string().nullable().optional(),
})

export const alpacaNewsResponseSchema = z.looseObject({
  news: z.array(alpacaNewsArticleSchema),
})

export const newsArticleSchema = z.object({
  author: z.string().optional(),
  createdAt: z.string(),
  headline: z.string(),
  id: z.number(),
  imageUrl: z.string().optional(),
  source: z.string().optional(),
  summary: z.string().optional(),
  symbols: z.array(z.string()),
  url: z.string().optional(),
})

export const newsSchema = z.array(newsArticleSchema)

export const newsQuerySchema = z.object({
  limit: z.preprocess(
    (value) => (value === null || value === '' ? undefined : value),
    z.coerce.number().int().min(1).max(50).default(12)
  ),
  symbols: optionalQueryString(
    z
      .string()
      .transform((value) => value.split(',').filter(Boolean))
      .pipe(z.array(z.string().min(1).max(32)).max(20))
  ),
})

export const alpacaMoverSchema = z.looseObject({
  change: z.number(),
  percent_change: z.number(),
  price: z.number(),
  symbol: z.string(),
})

export const alpacaMoversResponseSchema = z.looseObject({
  gainers: z.array(alpacaMoverSchema),
  losers: z.array(alpacaMoverSchema),
})

export const alpacaMostActivesResponseSchema = z.looseObject({
  most_actives: z.array(
    z.looseObject({
      symbol: z.string(),
      trade_count: z.number(),
      volume: z.number(),
    })
  ),
})

export const moverSchema = z.object({
  change: z.number(),
  percentChange: z.number(),
  price: z.number(),
  symbol: z.string(),
})

export const mostActiveSchema = z.object({
  symbol: z.string(),
  tradeCount: z.number(),
  volume: z.number(),
})

export const marketMoversSchema = z.object({
  gainers: z.array(moverSchema),
  losers: z.array(moverSchema),
  mostActives: z.array(mostActiveSchema),
})

const alpacaQuoteSchema = z.looseObject({
  ap: z.number(),
  as: z.number(),
  bp: z.number(),
  bs: z.number(),
  t: z.string(),
})

const alpacaTradeSchema = z.looseObject({
  p: z.number(),
  s: z.number(),
  t: z.string(),
  tks: z.string().optional(),
})

const alpacaBarSchema = z.looseObject({
  c: z.number(),
  h: z.number(),
  l: z.number(),
  o: z.number(),
  t: z.string(),
  v: z.number(),
})

export const alpacaSnapshotSchema = z.looseObject({
  dailyBar: alpacaBarSchema.optional(),
  latestQuote: alpacaQuoteSchema.optional(),
  latestTrade: alpacaTradeSchema.optional(),
  prevDailyBar: alpacaBarSchema.optional(),
})

export const alpacaCryptoSnapshotsSchema = z.looseObject({
  snapshots: z.record(z.string(), alpacaSnapshotSchema),
})

export const marketSnapshotSchema = z.object({
  askPrice: z.number().optional(),
  askSize: z.number().optional(),
  bidPrice: z.number().optional(),
  bidSize: z.number().optional(),
  dayHigh: z.number().optional(),
  dayLow: z.number().optional(),
  dayOpen: z.number().optional(),
  dayVolume: z.number().optional(),
  lastPrice: z.number().optional(),
  lastSize: z.number().optional(),
  previousClose: z.number().optional(),
  symbol: z.string(),
  updatedAt: z.string().optional(),
})

export const alpacaStockTradesSchema = z.looseObject({
  trades: z.array(alpacaTradeSchema).nullable(),
})

export const alpacaCryptoTradesSchema = z.looseObject({
  trades: z.record(z.string(), z.array(alpacaTradeSchema)),
})

export const marketTradeSchema = z.object({
  price: z.number(),
  side: z.enum(['buy', 'sell']).optional(),
  size: z.number(),
  timestamp: z.string(),
})

export const marketTradesSchema = z.array(marketTradeSchema)

const alpacaBookLevelSchema = z.looseObject({ p: z.number(), s: z.number() })

export const alpacaOrderbooksSchema = z.looseObject({
  orderbooks: z.record(
    z.string(),
    z.looseObject({
      a: z.array(alpacaBookLevelSchema),
      b: z.array(alpacaBookLevelSchema),
      t: z.string(),
    })
  ),
})

export const bookLevelSchema = z.object({
  price: z.number(),
  size: z.number(),
})

export const orderbookSchema = z.object({
  asks: z.array(bookLevelSchema),
  bids: z.array(bookLevelSchema),
  symbol: z.string(),
  timestamp: z.string(),
})

export const marketSnapshotsSchema = z.array(marketSnapshotSchema)

export const symbolsQuerySchema = z.object({
  symbols: z
    .string()
    .transform((value) => value.split(',').map((symbol) => symbol.trim()))
    .pipe(z.array(z.string().min(1).max(32)).min(1).max(200)),
})

export const symbolQuerySchema = z.object({
  symbol: z.string().trim().min(1).max(32),
})

export const optionTypeSchema = z.enum(['call', 'put'])

export const alpacaOptionContractSchema = z.looseObject({
  close_price: z.string().nullable().optional(),
  expiration_date: z.string(),
  id: z.string(),
  open_interest: z.string().nullable().optional(),
  strike_price: z.string(),
  symbol: z.string(),
  tradable: z.boolean(),
  type: optionTypeSchema,
  underlying_symbol: z.string(),
})

export const alpacaOptionContractsSchema = z.looseObject({
  next_page_token: z.string().nullable().optional(),
  option_contracts: z.array(alpacaOptionContractSchema).nullable(),
})

export const alpacaOptionSnapshotsSchema = z.looseObject({
  next_page_token: z.string().nullable().optional(),
  snapshots: z.record(
    z.string(),
    z.looseObject({
      greeks: z
        .looseObject({
          delta: z.number().optional(),
          gamma: z.number().optional(),
          theta: z.number().optional(),
          vega: z.number().optional(),
        })
        .optional(),
      impliedVolatility: z.number().optional(),
      latestQuote: alpacaQuoteSchema.optional(),
      latestTrade: alpacaTradeSchema.optional(),
    })
  ),
})

export const optionContractSchema = z.object({
  askPrice: z.number().optional(),
  bidPrice: z.number().optional(),
  closePrice: z.number().optional(),
  delta: z.number().optional(),
  expirationDate: z.string(),
  impliedVolatility: z.number().optional(),
  lastPrice: z.number().optional(),
  openInterest: z.number().optional(),
  strike: z.number(),
  symbol: z.string(),
  tradable: z.boolean(),
  type: optionTypeSchema,
})

export const optionChainSchema = z.object({
  calls: z.array(optionContractSchema),
  expirationDate: z.string().optional(),
  expirations: z.array(z.string()),
  puts: z.array(optionContractSchema),
  underlying: z.string(),
})

export const optionChainQuerySchema = z.object({
  expiration: optionalQueryString(z.iso.date()),
  underlying: z.string().trim().min(1).max(16),
})

export type MarketMovers = z.infer<typeof marketMoversSchema>
export type MarketSnapshot = z.infer<typeof marketSnapshotSchema>
export type MarketTrade = z.infer<typeof marketTradeSchema>
export type Mover = z.infer<typeof moverSchema>
export type NewsArticle = z.infer<typeof newsArticleSchema>
export type OptionChain = z.infer<typeof optionChainSchema>
export type OptionContract = z.infer<typeof optionContractSchema>
export type Orderbook = z.infer<typeof orderbookSchema>
