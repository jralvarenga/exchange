import type {
  ActivityLogRow,
  OrderEventRow,
  OrderRow,
} from '@workspace/db/queries/activity'

/** One line in the workspace history, safe to send to the client. */
export type HistoryEntry = {
  at: string
  connectionName: string | null
  detail: string | null
  environment: 'live' | 'paper' | null
  id: string
  side: 'buy' | 'sell' | null
  title: string
  userId: string | null
}

type OrderEventWithOrder = OrderEventRow & { order: OrderRow | null }

const actionTitles: Record<string, string> = {
  'connection.added': 'Added a connection',
  'connection.default_changed': 'Changed the default connection',
  'connection.keys_replaced': 'Replaced connection keys',
  'connection.removed': 'Removed a connection',
  'connection.renamed': 'Renamed a connection',
  'connection.switched': 'Switched connection',
  'connection.tested': 'Tested a connection',
  'deposit_address.removed': 'Removed a deposit address',
  'deposit_address.saved': 'Saved a deposit address',
  'invitation.revoked': 'Canceled an invitation',
  'invitation.sent': 'Invited a member',
  'member.joined': 'Joined the workspace',
  'member.left': 'Left the workspace',
  'member.removed': 'Removed a member',
  'member.role_changed': 'Changed a member role',
  'orders.canceled_all': 'Canceled all open orders',
  'positions.liquidated': 'Closed all positions',
  'trading_settings.updated': 'Updated trading settings',
  'workspace.created': 'Created the workspace',
  'workspace.renamed': 'Renamed the workspace',
  'workspace.switched': 'Opened the workspace',
}

/** Describes an order event: "Buy AAPL" with "10 shares · limit 150". */
export function orderEventToEntry(event: OrderEventWithOrder): HistoryEntry {
  const order = event.order
  const placed = event.type === 'placed' && order !== null

  return {
    at: event.createdAt.toISOString(),
    connectionName: event.connectionName,
    detail: placed ? describeOrder(order) : null,
    environment: toEnvironment(event.environment),
    id: `order-event:${event.id}`,
    side: placed ? toSide(order.side) : null,
    title: orderEventTitle(event),
    userId: event.userId,
  }
}

/** Describes an activity log row with a short past-tense title. */
export function activityLogToEntry(log: ActivityLogRow): HistoryEntry {
  return {
    at: log.createdAt.toISOString(),
    connectionName: log.connectionName,
    detail: describeMetadata(log),
    environment: toEnvironment(log.environment),
    id: `activity:${log.id}`,
    side: null,
    title: actionTitles[log.action] ?? log.action,
    userId: log.userId,
  }
}

/** Merges order events and logs, newest first, capped at `limit`. */
export function mergeHistory(
  entries: HistoryEntry[][],
  limit: number
): HistoryEntry[] {
  return entries
    .flat()
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, limit)
}

/** Titles an order event by what happened and to which symbol. */
function orderEventTitle(event: OrderEventWithOrder): string {
  const order = event.order

  if (event.type === 'placed' && order) {
    return order.source === 'close_position'
      ? `Closed ${order.symbol}`
      : `${order.side === 'buy' ? 'Buy' : 'Sell'} ${order.symbol}`
  }

  const verb = event.type === 'replaced' ? 'Replaced' : 'Canceled'

  return order ? `${verb} ${order.symbol} order` : `${verb} an order`
}

/** Names what an order's quantity counts: shares, option contracts, or crypto units. */
function quantityUnit(assetClass: string | null): string {
  if (assetClass === 'crypto') {
    return 'units'
  }

  return assetClass === 'us_option' ? 'contracts' : 'shares'
}

/** Describes an order's size, type and prices: "10 shares · limit · at 150". */
function describeOrder(order: OrderRow): string {
  const size = order.notional
    ? `$${trimDecimal(order.notional)}`
    : order.quantity
      ? `${trimDecimal(order.quantity)} ${quantityUnit(order.assetClass)}`
      : null
  const parts = [
    size,
    order.type.replaceAll('_', ' '),
    order.limitPrice ? `at ${trimDecimal(order.limitPrice)}` : null,
    order.stopPrice ? `stop ${trimDecimal(order.stopPrice)}` : null,
  ]

  return parts.filter(Boolean).join(' · ')
}

/** Pulls the one human-relevant value out of a log's metadata. */
function describeMetadata(log: ActivityLogRow): string | null {
  const metadata = log.metadata ?? {}

  // Everyone in the workspace reads this history, so name the role, not the
  // invitee's email: pending invitations are only shown to owners and admins.
  if (log.action === 'invitation.sent' && typeof metadata.role === 'string') {
    return `As ${metadata.role.replaceAll('_', ' ')}`
  }

  if (log.action === 'workspace.renamed' && typeof metadata.to === 'string') {
    return metadata.to
  }

  if (log.action === 'member.role_changed' && typeof metadata.to === 'string') {
    return `Now ${metadata.to}`
  }

  if (
    (log.action === 'orders.canceled_all' ||
      log.action === 'positions.liquidated') &&
    typeof metadata.succeeded === 'number'
  ) {
    const failed =
      typeof metadata.failed === 'number' && metadata.failed > 0
        ? ` · ${metadata.failed} failed`
        : ''

    return `${metadata.succeeded} done${failed}`
  }

  if (
    log.action.startsWith('deposit_address.') &&
    typeof metadata.asset === 'string' &&
    typeof metadata.chain === 'string'
  ) {
    return `${metadata.asset} on ${metadata.chain}`
  }

  return null
}

/** Drops trailing zeros from a numeric string: "10.500" becomes "10.5". */
function trimDecimal(value: string): string {
  return value.includes('.') ? value.replace(/\.?0+$/u, '') : value
}

/** Narrows a stored environment value. */
function toEnvironment(value: string | null): 'live' | 'paper' | null {
  return value === 'live' || value === 'paper' ? value : null
}

/** Narrows a stored side value. */
function toSide(value: string): 'buy' | 'sell' | null {
  return value === 'buy' || value === 'sell' ? value : null
}
