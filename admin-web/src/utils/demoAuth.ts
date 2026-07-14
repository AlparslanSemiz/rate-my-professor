import { isRequiredAdminEmail } from './adminAccess'

const DEFAULT_DEMO_ADMIN_TOKEN = 'dev-admin-token'
const DEFAULT_DEMO_LOGIN_CODE = '123456'

function isDemoLocalMode() {
  return import.meta.env.MODE === 'demo-local'
}

export function getDemoAdminTokenForEmail(email: string | undefined) {
  if (!isDemoLocalMode() || !email || !isRequiredAdminEmail(email)) return null
  return import.meta.env.VITE_DEMO_ADMIN_TOKEN ?? DEFAULT_DEMO_ADMIN_TOKEN
}

export function isDemoLoginCode(code: string) {
  if (!isDemoLocalMode()) return false
  return code === (import.meta.env.VITE_DEMO_LOGIN_CODE ?? DEFAULT_DEMO_LOGIN_CODE)
}
