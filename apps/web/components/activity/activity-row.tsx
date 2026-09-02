'use client'

import { cn } from '@workspace/ui/lib/utils'
import { Wallet } from 'lucide-react'

import { AssetIcon } from '@/components/assets/asset-icon'
import {
  formatActivityDetail,
  formatActivitySide,
  formatActivityTime,
  formatActivityTitle,
  getActivityAssetClass,
} from '@/lib/activity/format-activity'
import type { AccountActivity } from '@/lib/alpaca/schemas'

interface Props {
  activity: AccountActivity
}

interface SideToneOptions {
  side?: AccountActivity['side']
}

/** Returns the text token that reflects a trade side. */
function getSideToneClass(options: SideToneOptions): string {
  if (options.side === 'buy') {
    return 'text-success'
  }

  if (options.side === 'sell') {
    return 'text-danger'
  }

  return 'text-muted-foreground'
}

/** Renders one account activity row with icon, labels, and amount. */
export function ActivityRow({ activity }: Props) {
  const title = formatActivityTitle(activity)
  const detail = formatActivityDetail({ activity })

  return (
    <li className="flex items-center gap-3 border-border/60 border-b py-3 last:border-b-0">
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
          <Wallet className="size-4" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{title}</p>
      </div>
      <p className="shrink-0 font-medium font-mono text-base tabular-nums">
        {detail}
      </p>
    </li>
  )
}
