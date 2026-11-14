import { cn } from '@workspace/ui/lib/utils'
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Coins,
  type LucideIcon,
  Percent,
  Receipt,
  Repeat,
  Wallet,
} from 'lucide-react'
import Link from 'next/link'

import { AssetIcon } from '@/components/assets/asset-icon'
import { getActivityAmount } from '@/lib/activity/activity-amount'
import {
  type ActivityKind,
  getActivityKind,
} from '@/lib/activity/activity-kind'
import { getActivityAssetClass } from '@/lib/activity/format-activity'
import { formatActivityClock } from '@/lib/activity/group-by-day'
import type { AccountActivity } from '@/lib/alpaca/schemas'
import { getAssetHref } from '@/lib/portfolio/asset-href'

interface Props {
  activity: AccountActivity
}

const kindIcons: Record<ActivityKind, LucideIcon> = {
  deposit: ArrowDownLeft,
  dividend: Coins,
  fee: Receipt,
  interest: Percent,
  other: Wallet,
  trade: Repeat,
  transfer: ArrowLeftRight,
  withdrawal: ArrowUpRight,
}

/** One activity: asset or kind icon, what happened and when, and the money involved. */
export function PortfolioActivityRow({ activity }: Props) {
  const kind = getActivityKind(activity)
  const amount = getActivityAmount(activity)
  const clock = formatActivityClock(activity)
  const href = getAssetHref({ symbol: activity.symbol })
  const KindIcon = kindIcons[kind.kind]
  const title = activity.symbol ?? kind.label
  const details = [activity.symbol ? kind.label : undefined, clock].filter(
    (detail) => detail !== undefined
  )

  if (details.length === 0 && !activity.side) {
    details.push(kind.kind === 'trade' ? 'Trade' : 'Cash activity')
  }

  return (
    <li
      className={cn(
        'relative -mx-3 grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl px-3 py-3 transition-colors',
        href &&
          'hover:bg-muted has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring'
      )}
    >
      {activity.symbol ? (
        <AssetIcon
          assetClass={getActivityAssetClass(activity.symbol)}
          symbol={activity.symbol}
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
        >
          <KindIcon className="size-5" />
        </span>
      )}
      <div className="flex min-w-0 flex-col gap-0.5">
        {href ? (
          <Link
            className="truncate font-bold text-lg outline-none after:absolute after:inset-0 after:rounded-2xl"
            href={href}
          >
            {title}
          </Link>
        ) : (
          <span className="truncate font-bold text-lg">{title}</span>
        )}
        <span className="truncate text-muted-foreground">
          {activity.side ? (
            <>
              <span
                className={cn(
                  'font-medium',
                  activity.side === 'buy'
                    ? 'text-market-up'
                    : 'text-market-down'
                )}
              >
                {activity.side === 'buy' ? 'Buy' : 'Sell'}
              </span>
              {details.length > 0 ? ' · ' : null}
            </>
          ) : null}
          {details.join(' · ')}
        </span>
      </div>
      <div className="flex flex-col items-end gap-0.5 tabular-nums">
        <span className="font-bold text-lg">{amount.primary}</span>
        {amount.secondary ? (
          <span className="text-muted-foreground">{amount.secondary}</span>
        ) : null}
      </div>
    </li>
  )
}
