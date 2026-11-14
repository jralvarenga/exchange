import type { AccountActivity } from '@/lib/alpaca/schemas'
import {
  formatCurrency,
  formatQuantity,
  formatSignedCurrency,
} from '@/lib/utils'

export type ActivityAmount = {
  /** The headline figure: a fill's total, or the cash that moved. */
  primary: string
  /** How a fill's total was reached: `quantity × price`. */
  secondary?: string
}

/** Parses an Alpaca decimal string, or returns undefined when it is missing or not a number. */
function toFinite(value?: string): number | undefined {
  if (value === undefined || value === '') {
    return undefined
  }

  const number = Number(value)

  return Number.isFinite(number) ? number : undefined
}

/**
 * Describes the money in one activity: a fill reads as its total with
 * `quantity × price` beneath, cash activity as its signed net amount.
 */
export function getActivityAmount(activity: AccountActivity): ActivityAmount {
  const quantity = toFinite(activity.quantity)
  const price = toFinite(activity.price)
  const netAmount = toFinite(activity.netAmount)

  if (quantity !== undefined && price !== undefined) {
    return {
      primary: formatCurrency({
        currency: 'USD',
        value: Math.abs(quantity) * price,
      }),
      secondary: `${formatQuantity({ value: Math.abs(quantity) })} × ${formatCurrency({ currency: 'USD', value: price })}`,
    }
  }

  if (netAmount !== undefined) {
    return {
      primary: formatSignedCurrency({ currency: 'USD', value: netAmount }),
    }
  }

  if (quantity !== undefined) {
    return { primary: formatQuantity({ value: quantity }) }
  }

  return { primary: '—' }
}
