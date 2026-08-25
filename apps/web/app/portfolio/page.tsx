import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Portfolio',
}

export default function Page() {
  return (
    <div className="flex max-w-prose flex-col gap-2">
      <h1 className="font-bold text-2xl">Portfolio</h1>
      <p className="text-muted-foreground">
        Holdings and performance across your accounts.
      </p>
    </div>
  )
}
