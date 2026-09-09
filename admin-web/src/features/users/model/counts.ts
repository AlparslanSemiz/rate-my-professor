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
