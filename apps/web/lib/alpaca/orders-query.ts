import { ordersAndPositionsQuerySchema } from '@/lib/alpaca/schemas'

/** Validates shared order-list query parameters, preserving schema defaults. */
export function parseOrdersQuery(
  searchParams: URLSearchParams
): ReturnType<typeof ordersAndPositionsQuerySchema.safeParse> {
  return ordersAndPositionsQuerySchema.safeParse({
    beforeOrderId: searchParams.get('beforeOrderId'),
    direction: searchParams.get('direction'),
    limit: searchParams.get('limit'),
    nested: searchParams.get('nested'),
    status: searchParams.get('status'),
    symbols: searchParams.get('symbols'),
  })
}
