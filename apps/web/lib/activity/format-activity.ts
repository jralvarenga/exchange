import type { AccountActivity, AssetSearchResult } from '@/lib/alpaca/schemas'
import { formatCurrency, formatSignedCurrency } from '@/lib/utils'

interface FormatActivityDetailOptions {
  activity: AccountActivity
}

/** Infers the searchable asset class from an activity symbol. */
export function getActivityAssetClass(
  symbol: string
): AssetSearchResult['assetClass'] {
  if (symbol.includes('/')) {
    return 'crypto'
  }

  if (/^[A-Z]{2,12}(?:USD|USDC|USDT)$/u.test(symbol)) {
    return 'crypto'
  }

  return 'us_equity'
}

/** Returns a readable side label for trade activity. */
export function formatActivitySide(side?: AccountActivity['side']): string {
  if (side === 'buy') {
    return 'Buy'
  }

  if (side === 'sell') {
    return 'Sell'
  }

  return 'Trade'
}

/** Formats the primary activity headline from type and side. */
export function formatActivityTitle(activity: AccountActivity): string {
  if (activity.symbol) {
    return activity.symbol
  }

  return activity.activityType.replaceAll('_', ' ')
}

/** Formats quantity, price, or net amount for one activity row. */
export function formatActivityDetail(
  options: FormatActivityDetailOptions
): string {
  const { activity } = options

  if (activity.quantity && activity.price) {
    const price = Number(activity.price)

    if (Number.isFinite(price)) {
      return formatCurrency({
        currency: 'USD',
        value: price,
      })
    }

    return activity.quantity
  }

  if (activity.netAmount) {
    const amount = Number(activity.netAmount)

    if (Number.isFinite(amount)) {
      return formatSignedCurrency({
        currency: 'USD',
        value: amount,
      })
    }
  }

  if (activity.quantity) {
    return activity.quantity
  }

  return '—'
}

/** Formats one activity timestamp for display. */
export function formatActivityTime(activity: AccountActivity): string {
  const timestamp = activity.transactionTime ?? activity.date

  if (!timestamp) {
    return 'Date unavailable'
  }

  return activityTimeFormatter.format(new Date(timestamp))
}

const activityTimeFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
})
