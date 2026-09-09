import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/client'
import { authService } from '@/api/auth'
import {
  authenticateAdmin,
  CODE_RATE_LIMITED_ERROR,
  getRequestCodeErrorMessage,
  NOT_AN_ADMIN_ERROR,
} from './authenticateAdmin'

vi.mock('@/api/auth', () => ({
  authService: {
    login: vi.fn(),
    me: vi.fn(),
  },
}))

const ADMIN_EMAIL = 'u-kisi4@student.kit.edu'

/** As `/auth/me` reports the account: a STUDENT to the backend, an admin to this panel. */
const sessionUser = {
  id: 'admin-uuid-1',
  name: 'Alparslan',
  email: ADMIN_EMAIL,
  role: 'STUDENT',
  isSuperAdmin: true,
}

describe('authenticateAdmin', () => {
  beforeEach(() => {
    vi.mocked(authService.login).mockResolvedValue({ token: 'mock-token-1' })
    vi.mocked(authService.me).mockResolvedValue({
      success: true,
      message: 'Signed in',
      user: sessionUser,
    })
  })

  it('takes the identity from /auth/me', async () => {
    const { user } = await authenticateAdmin(ADMIN_EMAIL, '123456')

    expect(user).toEqual({
      id: 'admin-uuid-1',
      name: 'Alparslan',
      email: ADMIN_EMAIL,
      // The account is a STUDENT to the backend; the panel's own admin list decides otherwise.
      role: 'ADMIN',
      // Carried through untouched: only the backend decides this one.
      isSuperAdmin: true,
    })
  })

  /**
   * The panel used to invent an admin whose id was the email address, store it as the session
   * user, and send it back to the backend as `createdFrom.id` on every warning issued.
   */
  it('fails rather than inventing an identity when the session reports no user', async () => {
    vi.mocked(authService.me).mockResolvedValue({ success: true, message: 'Signed in' })

    await expect(authenticateAdmin(ADMIN_EMAIL, '123456')).rejects.toThrow(
      /your admin account could not be read/,
    )
  })

  it('fails the same way when /auth/me does not answer at all', async () => {
    vi.mocked(authService.me).mockRejectedValue(new Error('The server returned an empty response.'))

    await expect(authenticateAdmin(ADMIN_EMAIL, '123456')).rejects.toThrow(
      /your admin account could not be read/,
    )
  })

  it('refuses an address outside the admin team before exchanging the code', async () => {
    await expect(authenticateAdmin('student@student.kit.edu', '123456')).rejects.toThrow(
      NOT_AN_ADMIN_ERROR,
    )
    expect(authService.login).not.toHaveBeenCalled()
  })
})

describe('getRequestCodeErrorMessage', () => {
  const FALLBACK = 'Could not send login code'

  it('says to wait when the request was rate-limited', () => {
    // What the client produces for a 429 with no message of its own — it names our endpoint
    // and a status, which tells the operator nothing about what to do next.
    const rateLimited = new ApiError(429, 'Request to /auth/request-login failed with status 429')

    expect(getRequestCodeErrorMessage(rateLimited, FALLBACK)).toBe(CODE_RATE_LIMITED_ERROR)
  })

  it('keeps every other refusal as the backend worded it', () => {
    const refused = new ApiError(400, 'That address is not a KIT address.')

    expect(getRequestCodeErrorMessage(refused, FALLBACK)).toBe('That address is not a KIT address.')
  })
})
