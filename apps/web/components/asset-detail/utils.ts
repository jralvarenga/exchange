import type { AssetInterval } from '@/lib/alpaca/schemas'

interface FormatAssetPriceOptions {
  currency?: string
  signed?: boolean
  value: number
}

interface FormatChartTimestampOptions {
  interval: AssetInterval
  timestamp: string
}

const quantityFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 8,
})

/** Formats asset prices with useful precision for both stocks and crypto. */
export function formatAssetPrice(options: FormatAssetPriceOptions): string {
  const absoluteValue = Math.abs(options.value)
  const maximumFractionDigits =
    absoluteValue >= 1_000 ? 2 : absoluteValue >= 1 ? 4 : 6

  return new Intl.NumberFormat('en-US', {
    currency: options.currency ?? 'USD',
    maximumFractionDigits,
    minimumFractionDigits: 2,
    signDisplay: options.signed ? 'exceptZero' : 'auto',
    style: 'currency',
  }).format(options.value)
}

/** Formats held quantities without unnecessary trailing zeroes. */
export function formatAssetQuantity(value: number): string {
  return quantityFormatter.format(value)
}

/** Formats chart ticks for the selected time horizon. */
export function formatChartTimestamp(
  options: FormatChartTimestampOptions
): string {
  const date = new Date(options.timestamp)

  if (options.interval === '1D') {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }

  if (options.interval === '1W' || options.interval === '1M') {
    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'short',
    }).format(date)
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: '2-digit',
  }).format(date)
}
