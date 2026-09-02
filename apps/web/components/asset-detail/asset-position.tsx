import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'

import {
  formatAssetPrice,
  formatAssetQuantity,
} from '@/components/asset-detail/utils'
import type { AssetDetail } from '@/lib/alpaca/schemas'
import { cn, formatSignedCurrency, formatSignedPercent } from '@/lib/utils'

interface Props {
  currency: AssetDetail['currency']
  position: AssetDetail['position']
}

/** Summarizes the account's current position in the selected asset. */
export function AssetPosition({ currency, position }: Props) {
  if (!position) {
    return (
      <Card className="h-full justify-between bg-muted/50 shadow-none">
        <CardHeader>
          <CardTitle>Your position</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="max-w-72 text-base text-muted-foreground">
            You don’t currently hold this asset.
          </p>
        </CardContent>
      </Card>
    )
  }

  const isPositive = position.unrealizedProfitLoss > 0
  const isNegative = position.unrealizedProfitLoss < 0

  return (
    <Card className="h-full bg-muted/50 shadow-none">
      <CardHeader>
        <CardTitle>Your position</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-5">
        <div>
          <p className="text-muted-foreground text-sm">Market value</p>
          <p className="mt-1 font-bold font-mono text-3xl tabular-nums">
            {formatAssetPrice({ currency, value: position.marketValue })}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
          <div>
            <dt className="text-muted-foreground text-sm">Quantity</dt>
            <dd className="mt-1 font-medium font-mono tabular-nums">
              {formatAssetQuantity(position.quantity)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-sm">Average entry</dt>
            <dd className="mt-1 font-medium font-mono tabular-nums">
              {formatAssetPrice({
                currency,
                value: position.averageEntryPrice,
              })}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-muted-foreground text-sm">Total return</dt>
            <dd
              className={cn(
                'mt-1 font-medium font-mono tabular-nums',
                isPositive && 'text-market-up',
                isNegative && 'text-market-down'
              )}
            >
              {formatSignedCurrency({
                currency,
                value: position.unrealizedProfitLoss,
              })}{' '}
              (
              {formatSignedPercent({
                value: position.unrealizedProfitLossPercent,
              })}
              )
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}
