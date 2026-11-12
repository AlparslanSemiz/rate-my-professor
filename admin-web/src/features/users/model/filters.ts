import type { UserQuery, UserRole, UserSort, UserStatus } from '@/api/users'
import { enumLabel } from '@/utils/enumLabel'

/**
 * The statuses the listing can be filtered by. `DELETED` is not among them: a deleted account
 * is anonymised and excluded from `GET /users` altogether, and asking for it is answered with
 * `Deleted users are not listed`.
 */
export const USER_STATUS_FILTERS: readonly Exclude<UserStatus, 'DELETED'>[] = Object.freeze([
  'ACTIVE',
  'INACTIVE',
  'BLOCKED',
] as const)

/** The roles the listing can be filtered by. */
export const USER_ROLE_FILTERS: readonly UserRole[] = Object.freeze(['ADMIN', 'STUDENT'] as const)

/** The orderings the listing offers, in the order they appear. */
export const USER_SORTS: readonly UserSort[] = Object.freeze(['newest', 'oldest'] as const)

/** The filter form's working copy, before it becomes a query. */
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
export const EMPTY_USER_FILTERS: UserFilterDraft = Object.freeze({
  q: '',
  status: null,
  role: null,
  sort: 'newest',
})

/** The query behind an untouched filter form. Shared by every caller, so frozen. */
export const NO_USER_QUERY: UserQuery = Object.freeze({ sort: 'newest' })

/**
 * Turns the filter form into a request.
 *
 * A blank search becomes `undefined` rather than `''`: sending `q=` asks the backend to filter
 * for the empty string instead of not filtering.
 *
 * @param draft the form's working copy
 * @returns the query, with absent filters omitted
 */
export function toUserQuery(draft: UserFilterDraft): UserQuery {
  return {
    q: draft.q.trim() || undefined,
    status: draft.status ?? undefined,
    role: draft.role ?? undefined,
    sort: draft.sort,
  }
}

/**
 * @param values enum values as the backend spells them
 * @returns dropdown options, each labelled by `enumLabel` rather than by a hand-written table
 */
export function toSelectOptions(values: readonly string[]) {
  return values.map((value) => ({ value, label: enumLabel(value) }))
}

/** @returns whether the value is a status the listing can filter by. */
export function isUserStatusFilter(value: string | null): value is UserStatus {
  return USER_STATUS_FILTERS.some((status) => status === value)
}

/** @returns whether the value is a role the listing can filter by. */
export function isUserRoleFilter(value: string | null): value is UserRole {
  return USER_ROLE_FILTERS.some((role) => role === value)
}

/** @returns whether the value is an ordering the listing offers. */
export function isUserSort(value: string | null): value is UserSort {
  return USER_SORTS.some((sort) => sort === value)
}
