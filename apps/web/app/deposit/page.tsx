import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Deposit',
}

export default function Page() {
  return (
    <div className="flex max-w-prose flex-col gap-2">
      <h1 className="font-bold text-2xl">Deposit</h1>
      <p className="text-muted-foreground">
        Add funds so they are ready to trade.
      </p>
    </div>
  )
}
