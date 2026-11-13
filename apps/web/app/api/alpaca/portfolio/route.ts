import { recordActivity } from '@/lib/activity/record'
import { getPortfolio } from '@/lib/alpaca/client'
import { createApiResponse } from '@/lib/alpaca/http'
import { closeAllPositions } from '@/lib/alpaca/trading'

/** Returns all open positions and aggregate portfolio values. */
export async function GET(): Promise<Response> {
  return createApiResponse(async function getOpenPortfolio({ alpaca }) {
    return getPortfolio(alpaca)
  })
}

/** Liquidates every open position after canceling open orders. */
export async function DELETE(): Promise<Response> {
  return createApiResponse(
    async function liquidatePortfolio({ actor, alpaca }) {
      const result = await closeAllPositions(alpaca)
      await recordActivity({
        action: 'positions.liquidated',
        actor,
        metadata: result,
      })

      return result
    },
    { exposeAlpacaMessage: true, trading: true }
  )
}
