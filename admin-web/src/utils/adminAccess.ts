const REQUIRED_ADMINS = {
  'u-kisi4@student.kit.edu': { name: 'Alparslan' },
  'u-kisi5@student.kit.edu': { name: 'Mustafa' },
  'u-kisi6@student.kit.edu': { name: 'Luis' },
  'u-kisi7@student.kit.edu': { name: 'Yavuz' },
  'u-kisi8@student.kit.edu': { name: 'Philipp' },
  'u-kisi9@student.kit.edu': { name: 'Enno' },
} as const

const REQUIRED_ADMIN_EMAILS = new Set(Object.keys(REQUIRED_ADMINS))

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

export function hasAdminAccess(subject: AdminAccessSubject): boolean {
  return subject.role === 'ADMIN' || isRequiredAdminEmail(subject.email ?? subject.kitEmail ?? '')
}

export function getRequiredAdminUser(email: string) {
  const normalizedEmail = normalizeEmail(email)
  const admin = REQUIRED_ADMINS[normalizedEmail as keyof typeof REQUIRED_ADMINS]
  if (!admin) return null

  return {
    id: normalizedEmail,
    name: admin.name,
    email: normalizedEmail,
    role: 'ADMIN',
  }
}

export function withRequiredAdminRole<T extends AdminAccessSubject & { role: string }>(subject: T): T {
  if (!isRequiredAdminEmail(subject.email ?? subject.kitEmail ?? '')) return subject
  return { ...subject, role: 'ADMIN' } as T
}
