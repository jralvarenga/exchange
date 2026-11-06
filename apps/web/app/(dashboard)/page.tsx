import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'

import { ActivityCard } from '@/components/activity/activity-card'
import { Balance } from '@/components/balance/balance'
import { Balances } from '@/components/balance/balances'

/** Renders the portfolio home: live balance, equity chart, and account detail. */
export default function Home() {
  return (
    <div className="flex flex-1 flex-col gap-8">
      <Balance />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:pl-24">
        <Card
          aria-labelledby="balances-title"
          className="md:col-span-2 md:self-start"
          role="region"
        >
          <CardHeader>
            <CardTitle id="balances-title">Balances</CardTitle>
          </CardHeader>
          <CardContent>
            <Balances />
          </CardContent>
        </Card>
        <ActivityCard className="md:max-h-[32rem]" />
      </div>
    </div>
  )
}
