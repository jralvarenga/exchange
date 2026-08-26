const currencyFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  currencyDisplay: 'narrowSymbol',
  style: 'currency',
})

const signedCurrencyFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  currencyDisplay: 'narrowSymbol',
  signDisplay: 'exceptZero',
  style: 'currency',
})

const percentFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: 'percent',
})

const signedPercentFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  signDisplay: 'exceptZero',
  style: 'percent',
})

const quantityFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 6,
})

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  month: 'short',
})

/** Formats an amount as a US dollar value. */
export function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}

/** Formats an amount as a US dollar value with an explicit plus or minus sign. */
export function formatSignedCurrency(value: number): string {
  return signedCurrencyFormatter.format(value)
}

/** Formats a percentage value expressed from 0 to 100. */
export function formatPercent(value: number): string {
  return percentFormatter.format(value / 100)
}

/** Formats a percentage value from 0 to 100 with an explicit sign. */
export function formatSignedPercent(value: number): string {
  return signedPercentFormatter.format(value / 100)
}

/** Formats an asset quantity with up to six decimal places. */
export function formatQuantity(value: number): string {
  return quantityFormatter.format(value)
}

/** Formats an ISO timestamp as a short month, day, and time. */
export function formatDateTime(value: string): string {
  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormatter.format(date)
}

/** Converts a snake_case API value such as stop_limit to sentence case. */
export function formatLabel(value: string): string {
  const spaced = value.replaceAll('_', ' ')

  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
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
