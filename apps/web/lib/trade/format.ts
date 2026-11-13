interface FormatRelativeTimeOptions {
  now: number
  timestamp: string
}

const compactFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
  notation: 'compact',
})

const relativeFormatter = new Intl.RelativeTimeFormat('en-US', {
  numeric: 'auto',
})

const tradeTimeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
})

const tradeDateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  month: 'short',
  second: '2-digit',
})

const calendarDateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeZone: 'UTC',
})

/** Formats a large volume or size compactly, such as `1.25M`. */
export function formatCompactNumber(value: number): string {
  return compactFormatter.format(value)
}

/**
 * Formats a trade timestamp as a local clock time with seconds, adding the
 * date for trades from an earlier day so sessions can't be confused.
 */
export function formatTradeTime(options: FormatRelativeTimeOptions): string {
  const date = new Date(options.timestamp)

  if (!Number.isFinite(date.getTime())) {
    return 'Time unavailable'
  }

  return date.toDateString() === new Date(options.now).toDateString()
    ? tradeTimeFormatter.format(date)
    : tradeDateTimeFormatter.format(date)
}

/** Formats a `YYYY-MM-DD` calendar date without shifting it to the local zone. */
export function formatCalendarDate(value: string): string {
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`)

  return Number.isFinite(date.getTime())
    ? calendarDateFormatter.format(date)
    : value
}

/** Describes how long ago a timestamp was, such as `3 hours ago`. */
export function formatRelativeTime(options: FormatRelativeTimeOptions): string {
  const timestamp = new Date(options.timestamp).getTime()

  if (!Number.isFinite(timestamp)) {
    return 'Time unavailable'
  }

  const seconds = Math.round((timestamp - options.now) / 1_000)
  const minutes = Math.round(seconds / 60)
  const hours = Math.round(minutes / 60)
  const days = Math.round(hours / 24)

  if (Math.abs(seconds) < 60) {
    return 'Just now'
  }

  if (Math.abs(minutes) < 60) {
    return relativeFormatter.format(minutes, 'minute')
  }

  if (Math.abs(hours) < 24) {
    return relativeFormatter.format(hours, 'hour')
  }

  return relativeFormatter.format(days, 'day')
}
