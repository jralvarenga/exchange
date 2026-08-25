import { getBalanceChanges } from '@/lib/alpaca/client'
import { createApiResponse } from '@/lib/alpaca/http'

/** Returns account balance changes for all supported dashboard intervals. */
export async function GET(): Promise<Response> {
  return createApiResponse(getBalanceChanges)
}
