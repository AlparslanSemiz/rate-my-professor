import { useCallback, useState } from 'react'
import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'
import { DEFAULT_PAGE_SIZE } from '@/api/client'
import { systemStatusService } from '@/api/system'
import { usersService, type User, type UserPage, type UserQuery } from '@/api/users'
import { updateById } from '@/utils/collection'
import { getErrorMessage } from '@/utils/getErrorMessage'
import {
  EMPTY_USER_COUNTS,
  EMPTY_USER_FILTERS,
  NO_USER_QUERY,
  toUserCounts,
  toUserQuery,
  type UserChange,
  type UserFilterDraft,
} from '../model'

const usersKeys = {
  all: ['users'] as const,
  counts: () => [...usersKeys.all, 'counts'] as const,
  list: (query: UserQuery) => [...usersKeys.all, 'list', query] as const,
}

/**
 * The counters above the table. A failure is deliberately swallowed rather than retried or
 * reported: the counters are a summary, the table is the screen, and a `/system/status` that
 * did not answer must not take the user list down with it. Unread counters render as dashes.
 */
async function fetchCounts() {
  try {
    return toUserCounts((await systemStatusService.getStatus()).counts)
  } catch {
    return EMPTY_USER_COUNTS
  }
}

type UserPages = InfiniteData<UserPage, string | null>

/** Both sides are built by `toUserQuery`, so their keys are in the same order. */
function isSameQuery(left: UserQuery, right: UserQuery): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

/** Applies a change to every loaded page, so the list reflects it without a second request. */
function patchPages(data: UserPages, patch: (users: readonly User[]) => User[]): UserPages {
  return { ...data, pages: data.pages.map((page) => ({ ...page, users: patch(page.users) })) }
}

/**
 * The users screen: a cursor-paged listing, its filter form, and the counters above it.
 *
 * Filtering is server-side, so `draft` (what is being typed) and `query` (what was submitted)
 * are separate — the same split as the audit log, and for the same reason.
 *
 * A write patches the pages already loaded rather than refetching them. Asking for the page
 * again would re-request fifty rows to change one of them, and would move rows under the
 * operator's cursor if the ordering happened to change.
 *
 * @returns the accounts and paging state, the filter draft, the counters, and the commands
 */
export function useUsersPage() {
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<UserFilterDraft>(EMPTY_USER_FILTERS)
  const [query, setQuery] = useState<UserQuery>(NO_USER_QUERY)

  const counts = useQuery({ queryKey: usersKeys.counts(), queryFn: fetchCounts })

  const users = useInfiniteQuery({
    queryKey: usersKeys.list(query),
    queryFn: ({ pageParam }) =>
      usersService.list({ ...query, limit: DEFAULT_PAGE_SIZE, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor,
    // Applying a filter is a different query. Without this the rows vanish while it runs, and
    // a *refused* filter would leave the operator with nothing at all — where the point of a
    // `400` like "Invalid user status" is to be read next to the list it failed to change.
    placeholderData: keepPreviousData,
  })

  /**
   * Keeps the list in step with what a profile action did, using the value the backend
   * reported. Patching the cache rather than invalidating it is deliberate: the modal has
   * already read the account back, and asking for the whole page again would re-request
   * fifty rows to change one of them.
   */
  const applyUserChange = useCallback(
    (id: string, change: UserChange) => {
      queryClient.setQueryData<UserPages>(usersKeys.list(query), (data) => {
        if (!data) return data
        if (change.type === 'deleted') {
          return patchPages(data, (rows) => rows.filter((row) => row.id !== id))
        }
        // An edit, a block and an unblock can each change any field, so the row is replaced
        // with what the backend now reports rather than patched with what was asked for.
        if (change.type === 'refreshed') {
          return patchPages(data, (rows) => updateById(rows, id, () => change.user))
        }
        return patchPages(data, (rows) =>
          updateById(rows, id, (row) => ({ ...row, warnings: change.warnings })),
        )
      })
    },
    [queryClient, query],
  )

  /**
   * Applying filters that are already in force is still a request the operator asked for —
   * they are re-reading the list, not changing it. The query key would not change, so
   * nothing would happen on its own; this asks for the read explicitly.
   */
  const refetchUsers = users.refetch
  const applyFilters = useCallback(
    (next: UserFilterDraft) => {
      const nextQuery = toUserQuery(next)
      if (isSameQuery(nextQuery, query)) {
        void refetchUsers()
        return
      }
      setQuery(nextQuery)
    },
    [query, refetchUsers],
  )

  const items = users.data?.pages.flatMap((page) => page.users) ?? []
  const hasLoaded = users.data !== undefined
  // A refused parameter comes back as a 400 with a message the operator has to act on —
  // "A cursor requires a limit", "Invalid user status" — so it is shown as the backend put it.
  const error = users.error ? getErrorMessage(users.error, 'Failed to load users') : ''

  return {
    items,
    counts: counts.data ?? EMPTY_USER_COUNTS,
    draft,
    setDraft,
    hasMore: users.hasNextPage,
    loading: users.isPending || (users.isFetching && !users.isFetchingNextPage),
    loadingMore: users.isFetchingNextPage,
    initialError: hasLoaded ? '' : error,
    tableError: hasLoaded ? error : '',
    retryInitialLoad: () => {
      void users.refetch()
    },
    applyFilters,
    clearFilters: useCallback(() => {
      setDraft(EMPTY_USER_FILTERS)
      setQuery(NO_USER_QUERY)
    }, []),
    loadMore: async () => {
      await users.fetchNextPage()
    },
    applyUserChange,
  }
}
