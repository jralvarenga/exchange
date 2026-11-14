'use client'

import { AccountBalances } from '@/components/account/account-balances'
import { AccountBuyingPower } from '@/components/account/account-buying-power'
import { AccountMargin } from '@/components/account/account-margin'

/**
 * Shows equity and cash, then buying power beside margin from `xl`. The
 * dashboard only renders once the connection is valid, so the data is ready.
 */
export function PortfolioBalances() {
  return (
    <div className="flex flex-col">
      <AccountBalances ready />
      <div className="grid grid-cols-1 xl:grid-cols-2 xl:gap-x-16">
        <AccountBuyingPower ready />
        <AccountMargin ready />
      </div>
    </div>
  )
}
