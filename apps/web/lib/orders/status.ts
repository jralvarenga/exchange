export type OrderStatusTone = 'filled' | 'open' | 'closed'

export type OrderStatusFilter = 'all' | OrderStatusTone

export type OrderStatusInfo = {
  isCancelable: boolean
  label: string
  tone: OrderStatusTone
}

/** Alpaca statuses for orders that are still working and can be canceled. */
const openStatuses = new Set([
  'accepted',
  'accepted_for_bidding',
  'held',
  'new',
  'partially_filled',
  'pending_new',
  'pending_replace',
])

/**
 * Maps an Alpaca order status to a readable label, a visual tone, and
 * whether the order can still be canceled.
 */
export function getOrderStatus(status: string): OrderStatusInfo {
  const label = status.replaceAll('_', ' ')
  const readable = label.charAt(0).toLocaleUpperCase('en-US') + label.slice(1)

  if (status === 'filled') {
    return { isCancelable: false, label: readable, tone: 'filled' }
  }

  if (openStatuses.has(status)) {
    return { isCancelable: true, label: readable, tone: 'open' }
  }

  return { isCancelable: false, label: readable, tone: 'closed' }
}
