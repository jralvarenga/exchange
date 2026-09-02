import { z } from 'zod'

export const assetChartTypeSchema = z.enum(['line', 'candlestick'])

export type AssetChartType = z.infer<typeof assetChartTypeSchema>
