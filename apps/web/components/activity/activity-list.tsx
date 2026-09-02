'use client'

import { ActivityEmpty } from '@/components/activity/activity-empty'
import { ActivityRow } from '@/components/activity/activity-row'
import { useAccountActivities } from '@/hooks/use-account-activities'

export const latestActivityPageSize = 8

interface Props {
  limit?: number
  pageSize?: number
}

/** Renders account activity rows for the home card or portfolio page. */
export function ActivityList({ limit, pageSize }: Props) {
  const resolvedPageSize = pageSize ?? limit ?? latestActivityPageSize
  const { data } = useAccountActivities({
    category: 'trade_activity',
    direction: 'desc',
    pageSize: resolvedPageSize,
  })
  const activities =
    limit === undefined ? data.activities : data.activities.slice(0, limit)

  if (activities.length === 0) {
    return <ActivityEmpty />
  }

  return (
    <ul className="flex flex-col">
      {activities.map((activity) => (
        <ActivityRow activity={activity} key={activity.id} />
      ))}
    </ul>
  )
}
