import {
  createApiResponse,
  createValidationErrorResponse,
} from '@/lib/alpaca/http'
import { getOptionChain } from '@/lib/alpaca/market-data'
import { optionChainQuerySchema } from '@/lib/alpaca/market-schemas'

/** Returns the option chain for an underlying symbol and expiration. */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const query = optionChainQuerySchema.safeParse({
    expiration: url.searchParams.get('expiration'),
    underlying: url.searchParams.get('underlying'),
  })

  if (!query.success) {
    return createValidationErrorResponse(query.error)
  }

  return createApiResponse(async function getChain({ alpaca }) {
    return getOptionChain({ ...alpaca, ...query.data })
  })
}
