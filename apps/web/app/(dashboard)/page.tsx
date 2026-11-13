import { Balance } from '@/components/balance/balance'
import { Balances } from '@/components/balance/balances'
import { RecentOrders } from '@/components/home/recent-orders'
import { TopPositions } from '@/components/home/top-positions'

/** Renders the portfolio home: live balance, account stats, holdings, orders. */
export default function Home() {
  return (
    <div className="flex flex-1 flex-col gap-10">
      <Balance />
      <div className="flex flex-col md:pl-24">
        <Balances />
        <div className="grid @5xl:grid-cols-2 grid-cols-1 @5xl:gap-x-16">
          <TopPositions />
          <RecentOrders />
        </div>
      </div>
    </div>
  )
}
