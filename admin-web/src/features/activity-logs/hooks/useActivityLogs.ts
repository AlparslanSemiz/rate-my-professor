import {
  activityLogsService,
  type ActivityLog,
  type ActivityLogFilters,
} from '../../../api/ActivityLogsService'
import { useCursorLogPage, type CursorLogPage } from '../../../hooks/useCursorLogPage'
import {
  EMPTY_ACTIVITY_FILTERS,
  EMPTY_ACTIVITY_META,
  NO_ACTIVITY_FILTERS,
  getActivityErrorMessage,
  toActivityFilters,
  validateActivityDraft,
} from '../activityLogModel'

const fetchMeta = () => activityLogsService.getMeta()

async function fetchPage(
  filters: ActivityLogFilters,
  cursor?: string | null,
): Promise<CursorLogPage<ActivityLog>> {
  const page = cursor
    ? await activityLogsService.getLogs(filters, cursor)
    : await activityLogsService.getLogs(filters)
  return { items: page.activityLogs, nextCursor: page.nextCursor }
}

export function useActivityLogs() {
  return useCursorLogPage({
    fetchMeta,
    fetchPage,
    toFilters: toActivityFilters,
    validateDraft: validateActivityDraft,
    getErrorMessage: getActivityErrorMessage,
    emptyMeta: EMPTY_ACTIVITY_META,
    emptyDraft: EMPTY_ACTIVITY_FILTERS,
    emptyFilters: NO_ACTIVITY_FILTERS,
    initialErrorFallback: 'Failed to load activity logs',
    filterErrorFallback: 'Failed to apply activity log filters',
    loadMoreErrorFallback: 'Failed to load more activity',
  })
}
