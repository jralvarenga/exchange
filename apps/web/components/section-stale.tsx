import { formatStaleRefresh } from '@/lib/utils'

interface Props {
  timestamp: number
}

/** Notes that a section is showing last-good values after a failed refresh. */
export function SectionStale({ timestamp }: Props) {
  return (
    <p className="font-medium text-muted-foreground" role="status">
      {formatStaleRefresh({ timestamp })}
    </p>
  )
}
