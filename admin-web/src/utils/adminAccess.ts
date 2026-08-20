/**
 * The addresses the panel treats as admins regardless of the role the backend reports. Only
 * membership is used — an identity is never built from this list, because an id the backend
 * did not issue must never be sent back to it.
 */
const REQUIRED_ADMIN_EMAILS = new Set([
  'u-kisi4@student.kit.edu', // Alparslan
  'u-kisi5@student.kit.edu', // demo admin
  'u-kisi6@student.kit.edu', // demo admin
  'u-kisi7@student.kit.edu', // demo admin
  'u-kisi8@student.kit.edu', // demo admin
  'u-kisi9@student.kit.edu', // demo admin
])

interface AdminAccessSubject {
  email?: string
  kitEmail?: string
  role?: string
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function isRequiredAdminEmail(email: string): boolean {
  return REQUIRED_ADMIN_EMAILS.has(normalizeEmail(email))
}

export function withRequiredAdminRole<T extends AdminAccessSubject & { role: string }>(subject: T): T {
  if (!isRequiredAdminEmail(subject.email ?? subject.kitEmail ?? '')) return subject
  return { ...subject, role: 'ADMIN' } as T
}
