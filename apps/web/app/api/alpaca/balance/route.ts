import { getCurrentBalance } from '@/lib/alpaca/client'
import { createApiResponse } from '@/lib/alpaca/http'

/** Returns the current Alpaca account balance and daily change. */
export async function GET(): Promise<Response> {
  return createApiResponse(getCurrentBalance)
}
