import type { User, Warning } from '@/api/users'

/**
 * One account as the profile modal needs it: the record and its warnings, read together.
 *
 * `user` is `null` when the account is genuinely gone rather than unreadable — a distinction
 * `useUserProfile` makes, because reporting a failed read as "not found" would tell the
 * operator something untrue.
 *
 * It lives in the model rather than beside either hook that uses it. `useUserProfile` reads
 * it and `useUserProfileActions` writes it back into the cache, so putting it on one of them
 * made the other import its sibling — and the two then imported each other.
 */
export interface LoadedProfile {
  user: User | null
  warnings: readonly Warning[]
}
