import { cn } from '@workspace/ui/lib/utils'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

import type { HistoryEntry } from '@/lib/activity/history'

interface Props {
  actorName: string
  entry: HistoryEntry
}

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  month: 'short',
  timeZone: 'UTC',
})

/** One history line: what happened, who did it, and on which connection. */
export function HistoryRow({ actorName, entry }: Props) {
  const SideIcon = entry.side === 'sell' ? ArrowDownRight : ArrowUpRight

  return (
    <li className="flex items-start justify-between gap-4 py-4">
      <div className="flex min-w-0 flex-col">
        <p className="flex items-center gap-1.5 font-bold text-lg">
          {entry.side ? (
            <SideIcon
              aria-hidden="true"
              className={cn(
                'size-4 shrink-0',
                entry.side === 'buy' ? 'text-market-up' : 'text-market-down'
              )}
            />
          ) : null}
          <span className="truncate">{entry.title}</span>
        </p>
        {entry.detail ? (
          <p className="truncate text-muted-foreground tabular-nums">
            {entry.detail}
          </p>
        ) : null}
        <p className="truncate text-muted-foreground">
          {actorName}
          {entry.connectionName ? ` · ${entry.connectionName}` : null}
          {entry.environment
            ? ` (${entry.environment === 'live' ? 'Live' : 'Paper'})`
            : null}
        </p>
      </div>
      <time
        className="shrink-0 font-mono text-muted-foreground tabular-nums"
        dateTime={entry.at}
      >
        {timeFormatter.format(new Date(entry.at))}
      </time>
    </li>
  )
}
