import type { AccountOrder } from '@/lib/alpaca/schemas'
import { formatCurrency, formatQuantity } from '@/lib/utils'

const orderTimeFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  month: 'short',
})

/**
 * Formats the most useful size of an order: the filled quantity once it has
 * filled, otherwise the requested quantity or notional dollar amount.
 */
export function formatOrderAmount(order: AccountOrder): string {
  const filled = Number(order.filledQuantity ?? 0)
  const requested = Number(order.quantity ?? 0)

  if (filled > 0 && requested > 0 && filled < requested) {
    return `${formatQuantity({ value: filled })} / ${formatQuantity({ value: requested })}`
  }

  if (filled > 0) {
    return formatQuantity({ value: filled })
  }

  if (requested > 0) {
    return formatQuantity({ value: requested })
  }

  if (order.notional) {
    return formatCurrency({ currency: 'USD', value: Number(order.notional) })
  }

  return '—'
}

/** Formats when an order was submitted as a short date and time. */
export function formatOrderTime(submittedAt: string | null): string {
  if (!submittedAt) {
    return 'Not submitted'
  }

  return orderTimeFormatter.format(new Date(submittedAt))
}
