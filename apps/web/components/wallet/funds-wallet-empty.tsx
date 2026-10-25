import { buttonVariants } from '@workspace/ui/components/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import Link from 'next/link'

/** Explains that the user has not added any deposit addresses yet. */
export function FundsWalletEmpty() {
  return (
    <Card className="flex min-h-0 flex-1 flex-col">
      <CardHeader>
        <CardTitle>Deposit</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col items-start justify-center gap-4">
        <p className="text-muted-foreground" role="status">
          Add the deposit addresses from your Alpaca account to fund it with
          USDC or USDT.
        </p>
        <Link href="/settings" className={buttonVariants()}>
          Add deposit wallets
        </Link>
      </CardContent>
    </Card>
  )
}
