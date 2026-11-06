export type OrderStatusTone = 'filled' | 'open' | 'closed'

export type OrderStatusFilter = 'all' | OrderStatusTone

export type OrderStatusInfo = {
  isCancelable: boolean
  label: string
  tone: OrderStatusTone
}

export type OrdersApiStatus = 'all' | 'closed' | 'open'

/**
 * Alpaca statuses that still represent a working order. These appear under
 * the Open filter even when a cancel or replace is already in flight.
 */
const openStatuses = new Set([
  'accepted',
  'accepted_for_bidding',
  'done_for_day',
  'held',
  'new',
  'partially_filled',
  'pending_cancel',
  'pending_new',
  'pending_replace',
])

/**
 * Alpaca statuses that still accept a cancel. `pending_cancel` and
 * `pending_replace` are excluded because a cancel or replace is already in
 * flight.
 */
const cancelableStatuses = new Set([
  'accepted',
  'accepted_for_bidding',
  'done_for_day',
  'held',
  'new',
  'partially_filled',
  'pending_new',
])

/**
 * Maps an Alpaca order status to a readable label, a visual tone, and
 * whether the order can still be canceled.
 *
 * Terminal and rejected states (`canceled`, `expired`, `replaced`,
 * `rejected`, `stopped`, `suspended`, `calculated`) stay closed and not
 * cancelable.
 */
export function getOrderStatus(status: string): OrderStatusInfo {
  const label = status.replaceAll('_', ' ')
  const readable = label.charAt(0).toLocaleUpperCase('en-US') + label.slice(1)

  if (status === 'filled') {
    return { isCancelable: false, label: readable, tone: 'filled' }
  }

  if (openStatuses.has(status)) {
    return {
      isCancelable: cancelableStatuses.has(status),
      label: readable,
      tone: 'open',
    }
  }

  return { isCancelable: false, label: readable, tone: 'closed' }
}

/** Maps a home pill filter to Alpaca's GET /orders `status` query. */
export function getOrdersApiStatus(filter: OrderStatusFilter): OrdersApiStatus {
  if (filter === 'filled' || filter === 'closed') {
    return 'closed'
  }

  return filter
}
