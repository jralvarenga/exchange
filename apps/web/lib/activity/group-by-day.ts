import type { AccountActivity } from '@/lib/alpaca/schemas'

export type ActivityDay = {
  activities: AccountActivity[]
  /** Local calendar date, `YYYY-MM-DD`, or `undated`. */
  key: string
  label: string
}

interface GroupActivitiesByDayOptions {
  activities: AccountActivity[]
  now?: Date
}

const dayFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'long',
  weekday: 'long',
})
const dayWithYearFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
})

/**
 * Reads when an activity happened. A date-only value (non-trade activity) is
 * a calendar day, so it is read in local time rather than as UTC midnight.
 */
export function getActivityDate(activity: AccountActivity): Date | undefined {
  const value = activity.transactionTime ?? activity.date

  if (!value) {
    return undefined
  }

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value)
  const date = dateOnly
    ? new Date(
        Number(dateOnly[1]),
        Number(dateOnly[2]) - 1,
        Number(dateOnly[3])
      )
    : new Date(value)

  return Number.isNaN(date.getTime()) ? undefined : date
}

/** Formats the clock time of an activity, or nothing when only its day is known. */
export function formatActivityClock(
  activity: AccountActivity
): string | undefined {
  if (!activity.transactionTime) {
    return undefined
  }

  const date = getActivityDate(activity)

  return date ? timeFormatter.format(date) : undefined
}

/** Groups activity, already sorted newest first, into labeled local days. */
export function groupActivitiesByDay(
  options: GroupActivitiesByDayOptions
): ActivityDay[] {
  const now = options.now ?? new Date()
  const days = new Map<string, ActivityDay>()

  for (const activity of options.activities) {
    const date = getActivityDate(activity)
    const key = date ? toDayKey(date) : 'undated'
    const day = days.get(key) ?? {
      activities: [],
      key,
      label: date ? formatDayLabel({ date, now }) : 'Date unavailable',
    }

    day.activities.push(activity)
    days.set(key, day)
  }

  return [...days.values()]
}

interface FormatDayLabelOptions {
  date: Date
  now: Date
}

/** Labels a day as Today, Yesterday, a weekday date, or a full date in an older year. */
function formatDayLabel(options: FormatDayLabelOptions): string {
  const today = toDayKey(options.now)
  const yesterday = new Date(options.now)

  yesterday.setDate(yesterday.getDate() - 1)

  const key = toDayKey(options.date)

  if (key === today) {
    return 'Today'
  }

  if (key === toDayKey(yesterday)) {
    return 'Yesterday'
  }

  return options.date.getFullYear() === options.now.getFullYear()
    ? dayFormatter.format(options.date)
    : dayWithYearFormatter.format(options.date)
}

/** Returns a local `YYYY-MM-DD` key for a date. */
function toDayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${date.getFullYear()}-${month}-${day}`
}
