import 'server-only'

import {
  listRecentActivityLogs,
  listRecentOrderEvents,
} from '@workspace/db/queries/activity'

import {
  activityLogToEntry,
  type HistoryEntry,
  mergeHistory,
  orderEventToEntry,
} from '@/lib/activity/history'

const HISTORY_LIMIT = 30

/** Loads the latest orders and changes in a workspace as one list. */
export async function listWorkspaceHistory(
  workspaceId: string
): Promise<HistoryEntry[]> {
  const [events, logs] = await Promise.all([
    listRecentOrderEvents({ limit: HISTORY_LIMIT, workspaceId }),
    listRecentActivityLogs({ limit: HISTORY_LIMIT, workspaceId }),
  ])

  return mergeHistory(
    [events.map(orderEventToEntry), logs.map(activityLogToEntry)],
    HISTORY_LIMIT
  )
}
