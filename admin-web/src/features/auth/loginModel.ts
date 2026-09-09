import { routes } from '@/constants/routes'

/**
 * What the backend mails out as a one-time login code. Both the form and the flow check
 * against this: a code that is too short cannot be right, and sending it anyway spends one of
 * the attempts the backend rate-limits.
 */
export const LOGIN_CODE_LENGTH = 6

export function isCompleteLoginCode(code: string): boolean {
  return code.trim().length === LOGIN_CODE_LENGTH
}

/** The path the admin was denied, carried by ProtectedRoute's redirect. */
export function attemptedPath(state: unknown): string | null {
  if (!state || typeof state !== 'object' || !('from' in state)) return null
  const from = (state as { from: unknown }).from
  if (typeof from !== 'string' || !from.startsWith('/') || from === routes.login) return null
  return from
}
