import { Wallet } from 'lucide-react'

/** Explains that no deposit address is saved yet and where to find one. */
export function FundingEmpty() {
  return (
    <div className="flex flex-col items-start gap-2 py-8" role="status">
      <Wallet aria-hidden="true" className="size-6 text-muted-foreground" />
      <p className="font-medium">No deposit addresses yet</p>
      <p className="text-muted-foreground">
        Add an address from your Alpaca crypto deposit screen to fund the
        account with USDC or USDT.
      </p>
    </div>
  )
}
