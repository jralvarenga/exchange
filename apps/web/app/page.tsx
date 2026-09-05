import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'

import { ActivityCard } from '@/components/activity/activity-card'
import { Balance } from '@/components/balance/balance'
import { Balances } from '@/components/balance/balances'

/** Renders the initial shell landing surface. */
export default function Home() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 md:h-full md:grid-cols-3 md:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]">
        <section
          aria-labelledby="balance-title"
          className="col-span-2 flex min-h-48 flex-col overflow-hidden rounded-[2rem] bg-primary text-primary-foreground md:h-full md:min-h-0"
        >
          <h2 id="balance-title" className="sr-only">
            Balance
          </h2>
          <Balance />
        </section>

        <ActivityCard className="row-span-2 min-h-80 md:h-full md:min-h-0" />

        <Card
          aria-labelledby="balances-title"
          className="col-span-2"
          role="region"
        >
          <CardHeader>
            <CardTitle id="balances-title">Balances</CardTitle>
          </CardHeader>
          <CardContent>
            <Balances />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
