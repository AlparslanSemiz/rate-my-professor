import { systemStatusService } from '../../../api/SystemStatusService'
import { usersService, type User, type UserQuery } from '../../../api/UsersService'
import { useCursorLogPage, type CursorLogPage } from '../../../hooks/useCursorLogPage'
import { getErrorMessage } from '../../../utils/getErrorMessage'
import {
  EMPTY_USER_COUNTS,
  EMPTY_USER_FILTERS,
  NO_USER_QUERY,
  toUserCounts,
  toUserQuery,
  USERS_PAGE_SIZE,
} from '../usersModel'

/**
 * The counters above the table. A failure here is deliberately swallowed: the counters are a
 * summary, the table is the screen, and a `/system/status` that did not answer must not take
 * the user list down with it. Unread counters render as dashes.
 */
async function fetchMeta() {
  try {
    const status = await systemStatusService.getStatus()
    return toUserCounts(status.counts)
  } catch {
    return EMPTY_USER_COUNTS
  }
}

async function fetchPage(
  filters: UserQuery,
  cursor?: string | null,
): Promise<CursorLogPage<User>> {
  const page = await usersService.list({ ...filters, limit: USERS_PAGE_SIZE, cursor })
  return { items: page.users, nextCursor: page.nextCursor }
}

/** The backend validates the parameters and says what is wrong with them, so nothing here does. */
const acceptDraft = () => ''

export function useUsersPage() {
  return useCursorLogPage({
    fetchMeta,
    fetchPage,
    toFilters: toUserQuery,
    validateDraft: acceptDraft,
    // A refused parameter comes back as a 400 with a usable message — "A cursor requires a
    // limit", "Invalid user status" — and the operator is the one who has to act on it.
    getErrorMessage,
    emptyMeta: EMPTY_USER_COUNTS,
    emptyDraft: EMPTY_USER_FILTERS,
    emptyFilters: NO_USER_QUERY,
    initialErrorFallback: 'Failed to load users',
    filterErrorFallback: 'Failed to apply the user filters',
    loadMoreErrorFallback: 'Failed to load more users',
  })
}
