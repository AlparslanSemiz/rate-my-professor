import type { UserRole, UserStatus } from '@/domain/user'

export type { UserRole, UserStatus }

/**
 * One warning on a student's record, flattened from what the backend sends.
 *
 * The issuer arrives nested under `createdFrom`; it is lifted here so nothing downstream has
 * to walk into it to answer "who issued this?".
 */
export interface Warning {
  /**
   * Address of the warning, needed to correct or withdraw it. Served since the 2026-08-20
   * release; the null case is kept only so an older deployment hides those controls instead
   * of offering an action with nothing to address.
   */
  id: string | null
  userID: string
  message: string
  createdAt: string
  /**
   * The issuing admin's student id — the same value `/auth/me` reports — so "did I issue
   * this?" is answered without a second lookup.
   */
  issuedBy: string
  /** The issuing admin as the operator knows them, for the history line. */
  issuedByName: string
}

/**
 * An account, student or admin, as every screen in the panel reads it.
 *
 * `role` is not always the backend's answer: `withRequiredAdminRole` promotes the six known
 * admin addresses, so the panel offers their controls even where the backend has not caught
 * up. The backend still authorises every request itself.
 */
export interface User {
  id: string
  username: string
  kitEmail: string
  role: UserRole
  status: UserStatus
  joined: string
  lastOnline: string
  biography: string
  warnings: number
  reports: number
  /** Served by both user reads since the 2026-08-20 release. */
  credibilityScore: number
}

/** The two orderings `GET /users` offers. Both are by join date; there is no third. */
export type UserSort = 'newest' | 'oldest'

/**
 * What `GET /users` accepts. Passing any of it switches the listing to strictly newest-first
 * — the "administrators first" ordering only happens on a call with no parameters at all,
 * because role is not a column the backend can order by.
 */
export interface UserQuery {
  limit?: number
  cursor?: string | null
  q?: string
  status?: UserStatus
  role?: UserRole
  sort?: UserSort
}

/** One page of the listing, with the cursor that fetches the next (see ADR 0006). */
export interface UserPage {
  readonly users: readonly User[]
  /** Null on the last page, and always null when no `limit` was passed. */
  nextCursor: string | null
}

/**
 * Partial edit of a user. An omitted field is left alone and an empty body is rejected, so
 * only the fields that actually changed are sent. The panel does not offer `kitEmail` as an
 * editable field — it is the login identity, and changing it is not exposed here.
 *
 * `status` takes `ACTIVE` and `BLOCKED` only — deleting anonymizes the account, which is
 * `DELETE /users/{id}` and not a field edit. Demoting an admin revokes its sessions.
 */
export interface UserUpdate {
  username?: string
  biography?: string
  status?: Extract<UserStatus, 'ACTIVE' | 'BLOCKED'>
  role?: UserRole
  credibilityScore?: number
}
