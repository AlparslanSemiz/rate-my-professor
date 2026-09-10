import type { SystemCounts } from '@/api/system'

/**
 * The figures above the table. They come from `/system/status`, because a page of fifty rows
 * cannot be counted into a total — and `null` is not zero: it means the counter was not read.
 */
export interface UserCounts {
  total: number | null
  active: number | null
  admins: number | null
}

/** Frozen: one object answers every caller that has nothing to show yet. */
export const EMPTY_USER_COUNTS: UserCounts = Object.freeze({
  total: null,
  active: null,
  admins: null,
})

/**
 * Reads the three figures above the table out of `/system/status`.
 *
 * A counter the backend did not serve stays `null`, which is **not** zero: "we did not read
 * this" and "there are none" look identical as a figure and mean opposite things, so the
 * table shows a dash for the first.
 *
 * @param counts the counters as `/system/status` reported them, or null when it did not
 * @returns the three figures, each null where the counter was absent
 */
export function toUserCounts(counts: SystemCounts | null): UserCounts {
  if (!counts) return EMPTY_USER_COUNTS
  return { total: counts.users, active: counts.activeUsers, admins: counts.admins }
}
