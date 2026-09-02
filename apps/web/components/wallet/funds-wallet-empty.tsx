import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'

/** Explains when no deposit env variables are configured. */
export function FundsWalletEmpty() {
  return (
    <Card className="flex min-h-0 flex-1 flex-col">
      <CardHeader>
        <CardTitle>Deposit</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col justify-center">
        <p className="text-muted-foreground" role="status">
          No deposit addresses are configured.
        </p>
      </CardContent>
    </Card>
  )
}
