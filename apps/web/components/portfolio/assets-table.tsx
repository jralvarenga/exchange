import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table'
import { cn } from '@workspace/ui/lib/utils'

import { AssetsTableEmpty } from '@/components/portfolio/assets-table-empty'
import { PositionSymbol } from '@/components/portfolio/position-symbol'
import type { PortfolioPosition } from '@/lib/alpaca/schemas'

interface Props {
  assets: PortfolioPosition[]
  limitShown?: number
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  currencyDisplay: 'narrowSymbol',
  style: 'currency',
})

const signedCurrencyFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  currencyDisplay: 'narrowSymbol',
  signDisplay: 'exceptZero',
  style: 'currency',
})

const percentFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  signDisplay: 'exceptZero',
  style: 'percent',
})

const quantityFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 6,
})

/** Displays portfolio assets with an optional maximum number of visible rows. */
export function AssetsTable({ assets, limitShown }: Props) {
  const visibleAssets =
    limitShown === undefined
      ? assets
      : assets.slice(0, Math.max(0, Math.floor(limitShown)))

  return (
    <div className="overflow-hidden rounded-3xl">
      <Table className="min-w-3xl">
        <TableCaption className="sr-only">Portfolio assets</TableCaption>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-5">Asset</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Market value</TableHead>
            <TableHead className="pr-5 text-right">Total P/L</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleAssets.length === 0 ? <AssetsTableEmpty /> : null}
          {visibleAssets.map((asset) => {
            const isGain = asset.unrealizedProfitLoss >= 0
            const direction =
              asset.unrealizedProfitLoss > 0
                ? 'Gain'
                : asset.unrealizedProfitLoss < 0
                  ? 'Loss'
                  : 'No change'

            return (
              <TableRow key={asset.assetId}>
                <TableCell className="pl-5 font-bold">
                  <div className="flex items-center gap-3">
                    <PositionSymbol
                      assetClass={asset.assetClass}
                      key={`${asset.assetClass}:${asset.symbol}`}
                      symbol={asset.symbol}
                    />
                    {asset.symbol}
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {currencyFormatter.format(asset.currentPrice)}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {quantityFormatter.format(asset.quantity)}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {currencyFormatter.format(asset.marketValue)}
                </TableCell>
                <TableCell
                  className={cn(
                    'pr-5 text-right font-medium font-mono tabular-nums',
                    isGain ? 'text-success' : 'text-danger'
                  )}
                >
                  <span className="sr-only">{direction}: </span>
                  {signedCurrencyFormatter.format(asset.unrealizedProfitLoss)}{' '}
                  <span>
                    (
                    {percentFormatter.format(asset.unrealizedProfitLossPercent)}
                    )
                  </span>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      {visibleAssets.length > 0 ? (
        <div className="flex justify-end border-t px-5 py-3">
          <a
            className="rounded-md text-muted-foreground text-xs underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring"
            href="https://parqet.com/api"
            rel="noreferrer"
            target="_blank"
          >
            Logos provided by Parqet
          </a>
        </div>
      ) : null}
    </div>
  )
}
