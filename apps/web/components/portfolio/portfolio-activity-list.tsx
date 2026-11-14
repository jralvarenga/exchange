'use client'

import { cn } from '@workspace/ui/lib/utils'

import { PortfolioActivityEmpty } from '@/components/portfolio/portfolio-activity-empty'
import { PortfolioActivityRow } from '@/components/portfolio/portfolio-activity-row'
import { PortfolioShowMore } from '@/components/portfolio/portfolio-show-more'
import { useAccountActivityPages } from '@/hooks/use-account-activities'
import { getActivityKind } from '@/lib/activity/activity-kind'
import type { ActivityCategoryFilter } from '@/lib/activity/category-filter'
import { groupActivitiesByDay } from '@/lib/activity/group-by-day'
import { matchesSymbolQuery } from '@/lib/portfolio/symbol-query'
import { revealClassName } from '@/lib/utils'

interface Props {
  filter: ActivityCategoryFilter
  query: string
}

const ACTIVITY_PAGE_SIZE = 50

/** Lists loaded activity under day headings, with older pages on demand. */
export function PortfolioActivityList({ filter, query }: Props) {
  const activityPages = useAccountActivityPages({
    category: filter === 'all' ? undefined : filter,
    pageSize: ACTIVITY_PAGE_SIZE,
  })
  const loadedActivities = activityPages.data.pages.flatMap(
    (page) => page.activities
  )
  const days = groupActivitiesByDay({
    activities: loadedActivities.filter((activity) =>
      matchesSymbolQuery({
        query,
        values: [activity.symbol, getActivityKind(activity).label],
      })
    ),
  })

  return (
    <div className="flex flex-col gap-6">
      {days.length === 0 ? (
        <PortfolioActivityEmpty
          reason={
            query.trim()
              ? 'search'
              : filter === 'all' && loadedActivities.length === 0
                ? 'none'
                : 'filter'
          }
        />
      ) : (
        <div className={cn('flex flex-col gap-8', revealClassName)}>
          {days.map((day) => (
            <section
              aria-labelledby={`activity-day-${day.key}`}
              className="flex flex-col gap-1"
              key={day.key}
            >
              <h3
                className="font-medium text-muted-foreground"
                id={`activity-day-${day.key}`}
              >
                {day.label}
              </h3>
              <ul className="flex flex-col">
                {day.activities.map((activity) => (
                  <PortfolioActivityRow activity={activity} key={activity.id} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
      {activityPages.hasNextPage ? (
        <PortfolioShowMore
          label="Show older activity"
          loading={activityPages.isFetchingNextPage}
          onClick={() => void activityPages.fetchNextPage()}
        />
      ) : null}
    </div>
  )
}
