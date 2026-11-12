import { useCallback, useMemo, useState } from 'react'
import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import type { AuditEntry, AuditLogFilters } from '@/api/logs'
import { EMPTY_AUDIT_META } from '@/domain/auditLog'
import {
  EMPTY_FILTERS,
  getLogErrorMessage,
  toLogFilters,
  validateLogDraft,
  type FilterDraft,
} from '../logModel'
import type { LogScreen } from '../logScreen'

/** No filters at all — the first page, and what clearing the form goes back to. */
const NO_FILTERS: AuditLogFilters = {}

/**
 * One log screen's data: the entries, the filter form, and the vocabulary it offers.
 *
 * Filtering is **server-side**, which is why there are two pieces of filter state rather than
 * one. `draft` is what the operator is typing and changes on every keystroke; `activeFilters`
 * is what has actually been submitted, and it is the query key — so an unsubmitted keystroke
 * does not fetch a page, and pressing Apply with nothing changed does not either.
 *
 * Generic over the entry and parameterised by the screen, because `/audit-logs` and
 * `/activity-logs` page identically and the cache key is the only thing that must not be
 * shared. There used to be a hook of this shape — `useCursorLogPage`, deleted with the
 * activity screen and again when the audit log moved to TanStack Query — and both log screens
 * used it. This is that seam, rebuilt on queries.
 *
 * @param screen which log this is, and everything that differs about it
 * @returns the entries and paging state, the filter draft and its validation error, the
 *          backend's filter vocabulary, and the commands to apply, clear and load more
 */
export function useLogPage<TEntry extends AuditEntry>(screen: LogScreen<TEntry>) {
  const [draft, setDraft] = useState<FilterDraft>(EMPTY_FILTERS)
  const [activeFilters, setActiveFilters] = useState<AuditLogFilters>(NO_FILTERS)
  /** A filter form the operator has to fix — not something the backend refused. */
  const [draftError, setDraftError] = useState('')

  /**
   * Query keys for this screen. Written out rather than inlined so the filters are visibly
   * part of the list's identity: changing them *is* a different query, which is what makes
   * applying a filter a cache lookup rather than a hand-managed reload. Rooted at the screen's
   * own key, so the two logs never read each other's pages.
   */
  const keys = useMemo(
    () => ({
      meta: () => [screen.queryKey, 'meta'] as const,
      list: (filters: AuditLogFilters) => [screen.queryKey, 'list', filters] as const,
    }),
    [screen.queryKey],
  )

  const service = screen.service
  const meta = useQuery({
    queryKey: keys.meta(),
    queryFn: () => service.getMeta(),
  })

  const logs = useInfiniteQuery({
    queryKey: keys.list(activeFilters),
    // The first page is fetched with one argument, not with an explicit `undefined` cursor:
    // the backend rejects a cursor without a limit, and the service's two signatures are the
    // contract the tests pin.
    queryFn: ({ pageParam }) =>
      pageParam === null ? service.getLogs(activeFilters) : service.getLogs(activeFilters, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor,
    // Applying a filter is a different query; keeping the previous rows on screen while it
    // runs is what makes a failure an alert above a list rather than an empty page.
    placeholderData: keepPreviousData,
  })

  const items = logs.data?.pages.flatMap((page) => page.entries) ?? []
  const hasLoaded = logs.data !== undefined
  const loadError = logs.error ?? meta.error

  const refetchLogs = logs.refetch
  const applyFilters = useCallback(
    (nextDraft: FilterDraft) => {
      const validationError = validateLogDraft(nextDraft)
      setDraftError(validationError)
      if (validationError) return

      const nextFilters = toLogFilters(nextDraft)
      // Applying filters that are already in force is still a request the operator asked
      // for. The query key would not change, so nothing would happen on its own.
      if (JSON.stringify(nextFilters) === JSON.stringify(activeFilters)) {
        void refetchLogs()
        return
      }
      setActiveFilters(nextFilters)
    },
    [activeFilters, refetchLogs],
  )

  const clearFilters = useCallback(() => {
    setDraft(EMPTY_FILTERS)
    setDraftError('')
    setActiveFilters(NO_FILTERS)
  }, [])

  return {
    items,
    meta: meta.data ?? EMPTY_AUDIT_META,
    draft,
    setDraft,
    hasMore: logs.hasNextPage,
    loading: logs.isPending || meta.isPending || (logs.isFetching && !logs.isFetchingNextPage),
    loadingMore: logs.isFetchingNextPage,
    /**
     * The two error slots the screen distinguishes: a first load that produced nothing takes
     * over the page, while a failure with rows already on screen is an alert above them —
     * losing the operator's list to report a failed page-two would be the worse outcome.
     */
    initialError: !hasLoaded && loadError ? getLogErrorMessage(loadError, screen.errors) : '',
    tableError:
      draftError || (hasLoaded && loadError ? getLogErrorMessage(loadError, screen.errors) : ''),
    retryInitialLoad: () => {
      void meta.refetch()
      void logs.refetch()
    },
    /** Re-reads the pages already on screen, under the filters in force. */
    reload: async () => {
      await logs.refetch()
    },
    applyFilters,
    clearFilters,
    loadMore: async () => {
      await logs.fetchNextPage()
    },
  }
}
