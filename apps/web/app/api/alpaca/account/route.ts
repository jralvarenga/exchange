import { getAccount } from '@/lib/alpaca/client'
import { createApiResponse } from '@/lib/alpaca/http'
import { accountSummarySchema } from '@/lib/alpaca/schemas'

/** Returns safe account status metadata without exposing account identifiers. */
export async function GET(): Promise<Response> {
  return createApiResponse(async function getAccountSummary() {
    const account = await getAccount()

    return accountSummarySchema.parse({
      accountBlocked: account.account_blocked,
      cryptoStatus: account.crypto_status,
      currency: account.currency,
      status: account.status,
      tradingBlocked: account.trading_blocked,
      transfersBlocked: account.transfers_blocked,
    })
  })
}
