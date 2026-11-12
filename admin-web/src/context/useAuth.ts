import { useContext } from 'react'
import { assert } from '@/utils/assert'
import { AuthContext } from './AuthContextValue'

/**
 * The signed-in session, for any component below `AuthProvider`.
 *
 * A missing provider is a wiring mistake rather than something an operator can cause, so it
 * is an assertion: the message names the fix and belongs in the console, not in an alert.
 *
 * @returns the auth context — the current user and token, and the session commands
 * @throws {AssertionError} when called outside an `AuthProvider`
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  assert(ctx, 'useAuth must be used inside AuthProvider')
  return ctx
}
