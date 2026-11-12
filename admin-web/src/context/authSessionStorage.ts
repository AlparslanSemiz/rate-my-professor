import { z } from 'zod'
import { apiClient } from '@/api/client'
import type { AuthUser } from './AuthContextValue'

const TOKEN_STORAGE_KEY = 'token'
const USER_STORAGE_KEY = 'user'

// `refine` rather than `.trim().min(1)`: the latter would also *transform*, quietly rewriting
// a stored name on every load. This validates exactly what the hand-written guard did and
// hands the value back untouched.
const requiredText = z.string().refine((value) => value.trim().length > 0)

/**
 * What a stored session has to look like to be trusted on the next load.
 *
 * `isSuperAdmin` is optional on purpose: a session stored before the backend reported the
 * flag is still a valid session, and an absent flag simply means "not elevated" until
 * `/auth/me` says otherwise. Anything that is neither absent nor a boolean is a payload we
 * did not write, and the whole session goes.
 */
const storedUserSchema = z.object({
  id: requiredText,
  name: requiredText,
  email: requiredText,
  role: requiredText,
  isSuperAdmin: z.boolean().optional(),
})

/** The session as the provider holds it: both fields set, or both null. */
export interface AuthState {
  token: string | null
  user: AuthUser | null
}

/** No session. Frozen, because this one object is returned to every caller that has none. */
export const EMPTY_AUTH_STATE: AuthState = Object.freeze({ token: null, user: null })

/**
 * Forgets the session everywhere it is held: browser storage and the API client.
 *
 * @see restoreSession for the read side
 */
export function clearStoredSession(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(USER_STORAGE_KEY)
  apiClient.setToken(null)
}

/**
 * Remembers a session so the next load starts signed in, and authorises the client to use it.
 *
 * @param token the bearer token the backend issued
 * @param user the account it belongs to, as `/auth/me` reported it
 */
export function storeSession(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token)
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
  apiClient.setToken(token)
}

/**
 * What browser storage holds, before anything is done about it.
 *
 * `unusable` is kept apart from `none` because the two call for opposite handling: nothing
 * stored is the ordinary state of a signed-out browser and must be left alone, whereas a
 * half-written or tampered-with session has to be erased.
 */
export type StoredSession =
  | { status: 'none' }
  | { status: 'unusable' }
  | { status: 'valid'; token: string; user: AuthUser }

/**
 * Reads what is in browser storage and says nothing more.
 *
 * Deliberately free of side effects. This used to be one function that read storage, wrote to
 * it, and reconfigured the API client, under a name that promised only the first — and it was
 * called as a `useState` initialiser, which React is free to invoke more than once. Whether
 * to act on what is stored is now the caller's decision, and `restoreSession` is where it is
 * made.
 *
 * @returns what is stored, classified — never a partial or unvalidated session
 */
export function readStoredSession(): StoredSession {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  const storedUser = localStorage.getItem(USER_STORAGE_KEY)

  if (!token && !storedUser) return { status: 'none' }
  // One without the other is a session half-written or half-cleared; neither half is usable.
  if (!token || !storedUser) return { status: 'unusable' }

  try {
    const parsed = storedUserSchema.safeParse(JSON.parse(storedUser))
    if (!parsed.success) return { status: 'unusable' }
    return { status: 'valid', token, user: parsed.data }
  } catch {
    // Not JSON at all. Nothing this panel wrote, so it is not a session.
    return { status: 'unusable' }
  }
}

/**
 * Takes up the stored session, if there is a usable one: authorises the API client with its
 * token, and erases anything stored that cannot be trusted.
 *
 * A command rather than a query, and named as one. It returns the session it restored because
 * the provider needs it as initial state, not because it is free of consequences.
 *
 * @returns the restored session, or the empty state when there was nothing to restore
 */
export function restoreSession(): AuthState {
  const stored = readStoredSession()

  if (stored.status === 'valid') {
    apiClient.setToken(stored.token)
    return { token: stored.token, user: stored.user }
  }

  if (stored.status === 'unusable') {
    clearStoredSession()
    return EMPTY_AUTH_STATE
  }

  apiClient.setToken(null)
  return EMPTY_AUTH_STATE
}
