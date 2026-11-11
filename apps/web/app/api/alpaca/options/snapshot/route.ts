import {
  createApiResponse,
  createValidationErrorResponse,
} from '@/lib/alpaca/http'
import { getOptionSnapshot } from '@/lib/alpaca/market-data'
import { optionSnapshotQuerySchema } from '@/lib/alpaca/market-schemas'

/** Returns the latest quote for one option contract. */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const query = optionSnapshotQuerySchema.safeParse({
    symbol: url.searchParams.get('symbol'),
  })

  if (!query.success) {
    return createValidationErrorResponse(query.error)
  }

  return createApiResponse(async function getContractQuote({ alpaca }) {
    return getOptionSnapshot({ ...alpaca, symbol: query.data.symbol })
  })
}
