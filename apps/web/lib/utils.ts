import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Resolves an app API path for the current runtime. */
export function getApiUrl(path: string): string {
  if (typeof window !== 'undefined') {
    return path
  }

  return new URL(path, getServerOrigin()).toString()
}

/** Returns the origin used to turn relative API paths into absolute URLs. */
function getServerOrigin(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  return `http://localhost:${process.env.PORT ?? '3000'}`
}

interface FormatCurrencyOptions {
  currency: string
  value: number
}

interface CurrencyParts {
  amount: string
  symbol: string
}

interface FormatPercentOptions {
  value: number
}

interface FormatUpdatedAtOptions {
  timestamp: number
}

interface GetCurrencyFormatterOptions {
  currency: string
  signed?: boolean
}

const signedPercentFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  signDisplay: 'exceptZero',
})

const updatedAtFormatter = new Intl.DateTimeFormat('en-US', {
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  month: 'long',
  timeZoneName: 'short',
})

const currencyFormatters = new Map<string, Intl.NumberFormat>()

/** Returns a cached currency formatter for the requested currency and sign. */
function getCurrencyFormatter(
  options: GetCurrencyFormatterOptions
): Intl.NumberFormat {
  const key = `${options.currency}:${options.signed ? 'signed' : 'plain'}`
  const cached = currencyFormatters.get(key)

  if (cached) {
    return cached
  }

  const formatter = new Intl.NumberFormat('en-US', {
    currency: options.currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    signDisplay: options.signed ? 'exceptZero' : 'auto',
    style: 'currency',
  })

  currencyFormatters.set(key, formatter)
  return formatter
}

/** Formats a numeric amount as localized currency. */
export function formatCurrency(options: FormatCurrencyOptions): string {
  return getCurrencyFormatter({ currency: options.currency }).format(
    options.value
  )
}

/** Splits a currency amount into a symbol prefix and a grouped number. */
export function formatCurrencyParts(
  options: FormatCurrencyOptions
): CurrencyParts {
  const parts = getCurrencyFormatter({
    currency: options.currency,
  }).formatToParts(options.value)
  let amount = ''
  let symbol = ''

  for (const part of parts) {
    if (part.type === 'currency') {
      symbol += part.value
      continue
    }

    amount += part.value
  }

  return { amount: amount.trim(), symbol }
}

/** Formats a currency amount with an explicit plus or minus sign. */
export function formatSignedCurrency(options: FormatCurrencyOptions): string {
  return getCurrencyFormatter({
    currency: options.currency,
    signed: true,
  }).format(options.value)
}

/** Formats a percent change with an explicit plus or minus sign. */
export function formatSignedPercent(options: FormatPercentOptions): string {
  return `${signedPercentFormatter.format(options.value)}%`
}

/** Formats a query update time as a long local date and clock time. */
export function formatUpdatedAt(options: FormatUpdatedAtOptions): string {
  return updatedAtFormatter.format(options.timestamp)
}
