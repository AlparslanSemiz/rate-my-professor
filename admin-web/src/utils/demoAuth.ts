import { normalizeEmail } from './adminAccess'

const DEFAULT_DEMO_ADMIN_TOKEN = 'dev-admin-token'
const DEFAULT_DEMO_LOGIN_CODE = '123456'

// Only this account is pre-seeded with the shared demo token in the mock DB.
// Other required admins fall through to the normal mock login flow, which
// creates them and issues a proper per-user token.
const DEMO_ADMIN_EMAIL = 'u-kisi4@student.kit.edu'

function isDemoLocalMode() {
  return import.meta.env.MODE === 'demo-local'
}

export function getDemoAdminTokenForEmail(email: string | undefined) {
  if (!isDemoLocalMode() || !email || normalizeEmail(email) !== DEMO_ADMIN_EMAIL) return null
  return import.meta.env.VITE_DEMO_ADMIN_TOKEN ?? DEFAULT_DEMO_ADMIN_TOKEN
}

export function isDemoLoginCode(code: string) {
  if (!isDemoLocalMode()) return false
  return code === (import.meta.env.VITE_DEMO_LOGIN_CODE ?? DEFAULT_DEMO_LOGIN_CODE)
}
