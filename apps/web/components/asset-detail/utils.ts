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

interface FormatRelativeUpdateOptions {
  now: number
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

/** Describes how recently the latest market event was received. */
export function formatRelativeUpdate(
  options: FormatRelativeUpdateOptions
): string {
  const timestamp = new Date(options.timestamp).getTime()

  if (!Number.isFinite(timestamp)) {
    return 'Update time unavailable'
  }

  const elapsedSeconds = Math.max(
    0,
    Math.floor((options.now - timestamp) / 1_000)
  )

  if (elapsedSeconds < 15) {
    return 'Updated just now'
  }

  if (elapsedSeconds < 60) {
    return `Updated ${elapsedSeconds} seconds ago`
  }

  const elapsedMinutes = Math.floor(elapsedSeconds / 60)

  if (elapsedMinutes < 60) {
    return `Updated ${elapsedMinutes} ${elapsedMinutes === 1 ? 'minute' : 'minutes'} ago`
  }

  return `Updated ${new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp))}`
}
