/**
 * What an account may do. Two values, and there is no third.
 *
 * The elevated operator — the admin who may moderate other admins — is **not** a role. The
 * backend grants it as a behaviour and reports it as `isSuperAdmin` on `/auth/me`; the panel
 * reads it to decide which controls to offer and keeps rendering `ADMIN`. See ADR 0004.
 */
export type UserRole = 'STUDENT' | 'ADMIN'
/**
 * Where an account stands. `INACTIVE` is the backend's own (an account that never confirmed);
 * the panel neither sets nor clears it. `DELETED` means anonymised, and such accounts are
 * excluded from `GET /users` altogether — asking for them is refused.
 */
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'DELETED'

/** How a user is referenced from content and reports: enough to render a chip and open the profile. */
export interface UserReference {
  id: string
  name: string
  role: UserRole
  warnings: number
  status: UserStatus
}
