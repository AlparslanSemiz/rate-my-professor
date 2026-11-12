/**
 * The addresses the panel treats as admins regardless of the role the backend reports. Only
 * membership is used — an identity is never built from this list, because an id the backend
 * did not issue must never be sent back to it.
 */
const REQUIRED_ADMIN_EMAILS = new Set([
  'unzhz@student.kit.edu', // Alparslan
  'ugoqu@student.kit.edu', // Mustafa
  'ugjlu@student.kit.edu', // Luis
  'uzvqy@student.kit.edu', // Yavuz
  'uiolj@student.kit.edu', // Philipp
  'uchbm@student.kit.edu', // Enno
])

interface AdminAccessSubject {
  email?: string
  kitEmail?: string
  role?: string
}

/**
 * @param email an address as typed
 * @returns it trimmed and lower-cased, so comparison does not depend on how it was entered
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Whether this address is offered a login code.
 *
 * A usability gate, not security: it decides what the panel *offers*, and the backend
 * independently authorises every protected request. See ADR 0010, which records that this
 * list ships in the bundle and why that is accepted.
 *
 * @param email the address to check
 * @returns whether it is on the admin team's list
 */
export function isRequiredAdminEmail(email: string): boolean {
  return REQUIRED_ADMIN_EMAILS.has(normalizeEmail(email))
}

/**
 * Promotes a known admin address to the `ADMIN` role, whatever role the backend reported.
 *
 * So the panel offers the right controls to the six accounts on the team even where the
 * backend's own record has not caught up. Returns a **copy** — the argument is never mutated,
 * because these objects come out of the query cache.
 *
 * The role is the only thing taken from the list. An identity is never built from it: an id
 * the backend did not issue was once sent back as the author of a warning.
 *
 * @param subject an account, by either field spelling the backend uses
 * @returns the account, with `role` forced to `ADMIN` when the address is on the list
 */
export function withRequiredAdminRole<T extends AdminAccessSubject & { role: string }>(subject: T): T {
  if (!isRequiredAdminEmail(subject.email ?? subject.kitEmail ?? '')) return subject
  return { ...subject, role: 'ADMIN' } as T
}
