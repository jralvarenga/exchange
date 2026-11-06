import { Balance } from '@/components/balance/balance'
import { Balances } from '@/components/balance/balances'
import { RecentOrders } from '@/components/home/recent-orders'
import { TopPositions } from '@/components/home/top-positions'

/** Renders the portfolio home: live balance, account stats, holdings, orders. */
export default function Home() {
  return (
    <div className="flex flex-1 flex-col gap-10">
      <Balance />
      <div className="flex flex-col gap-14 md:pl-24">
        <Balances />
        <div className="grid grid-cols-1 gap-14 xl:grid-cols-2 xl:gap-16">
          <TopPositions />
          <RecentOrders />
        </div>
      </div>
    </div>
  )
}
