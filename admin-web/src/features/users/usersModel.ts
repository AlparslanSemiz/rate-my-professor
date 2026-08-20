import type { UserQuery, UserRole, UserSort, UserStatus } from '../../api/UsersService'
import { enumLabel } from '../../utils/enumLabel'

/** How many rows one page of the listing holds. The backend accepts 1–100. */
export const USERS_PAGE_SIZE = 50

/**
 * The statuses the listing can be filtered by. `DELETED` is not among them: a deleted account
 * is anonymised and excluded from `GET /users` altogether, and asking for it is answered with
 * `Deleted users are not listed`.
 */
export const USER_STATUS_FILTERS: Exclude<UserStatus, 'DELETED'>[] = [
  'ACTIVE',
  'INACTIVE',
  'BLOCKED',
]

export const USER_ROLE_FILTERS: UserRole[] = ['ADMIN', 'STUDENT']

export const USER_SORTS: UserSort[] = ['newest', 'oldest']

export interface UserFilterDraft {
  q: string
  status: UserStatus | null
  role: UserRole | null
  sort: UserSort
}

/**
 * Newest first, because the listing is paginated: passing any parameter at all switches the
 * backend to `(createdAt DESC, id DESC)`, so "administrators first" is not on offer here.
 */
export const EMPTY_USER_FILTERS: UserFilterDraft = {
  q: '',
  status: null,
  role: null,
  sort: 'newest',
}

export const NO_USER_QUERY: UserQuery = { sort: 'newest' }

export function toUserQuery(draft: UserFilterDraft): UserQuery {
  return {
    q: draft.q.trim() || undefined,
    status: draft.status ?? undefined,
    role: draft.role ?? undefined,
    sort: draft.sort,
  }
}

export function toSelectOptions(values: string[]) {
  return values.map((value) => ({ value, label: enumLabel(value) }))
}

export function isUserStatusFilter(value: string | null): value is UserStatus {
  return USER_STATUS_FILTERS.some((status) => status === value)
}

export function isUserRoleFilter(value: string | null): value is UserRole {
  return USER_ROLE_FILTERS.some((role) => role === value)
}

export function isUserSort(value: string | null): value is UserSort {
  return USER_SORTS.some((sort) => sort === value)
}

/**
 * The figures above the table. They come from `/system/status`, because a page of fifty rows
 * cannot be counted into a total — and `null` is not zero: it means the counter was not read.
 */
export interface UserCounts {
  total: number | null
  active: number | null
  admins: number | null
}

export const EMPTY_USER_COUNTS: UserCounts = { total: null, active: null, admins: null }

export function toUserCounts(counts: Record<string, number> | null): UserCounts {
  if (!counts) return EMPTY_USER_COUNTS
  return {
    total: counts.users ?? null,
    active: counts.activeUsers ?? null,
    admins: counts.admins ?? null,
  }
}
