import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  apiClient,
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  RateLimitedError,
  UnauthorizedError,
} from '@/api/client'
import { authService } from '@/api/auth'
import {
  ADMIN_ACCESS_ERROR,
  authenticateAdmin,
  CODE_RATE_LIMITED_ERROR,
  getLoginErrorMessage,
  getRequestCodeErrorMessage,
  IDENTITY_REFUSED_ERROR,
  IDENTITY_ROUTE_MISSING_ERROR,
  NOT_AN_ADMIN_ERROR,
} from './authenticateAdmin'

vi.mock('@/api/auth', () => ({
  authService: {
    login: vi.fn(),
    me: vi.fn(),
  },
}))

const ADMIN_EMAIL = 'unzhz@student.kit.edu'

/** As `/auth/me` reports the account: a STUDENT to the backend, an admin to this panel. */
const sessionUser = {
  id: 'admin-uuid-1',
  name: 'Alparslan',
  email: ADMIN_EMAIL,
  role: 'STUDENT',
  isSuperAdmin: true,
}

describe('authenticateAdmin', () => {
  const setToken = vi.spyOn(apiClient, 'setToken')

  afterEach(() => {
    apiClient.setToken(null)
  })

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

  /**
   * `F-014`. All four of these used to collapse into "your admin account could not be read",
   * which is wrong for three of them — and unrecoverable, because the type that carried the
   * real answer was discarded by a bare `catch` before anything could read it.
   */
  describe('when the identity read itself fails', () => {
    it('reports a refused account as not authorized, not as unreadable', async () => {
      vi.mocked(authService.me).mockRejectedValue(new ForbiddenError('Not an admin'))

      // The type survives, so the message the login screen shows is decided by the one
      // function that owns that decision rather than by a swallowed error.
      await expect(authenticateAdmin(ADMIN_EMAIL, '123456')).rejects.toBeInstanceOf(ForbiddenError)
      await expect(
        authenticateAdmin(ADMIN_EMAIL, '123456').catch(getLoginErrorMessage),
      ).resolves.toBe(ADMIN_ACCESS_ERROR)
    })

    it('says the identity route is missing on a 404', async () => {
      // The legacy `/auth/me` removed — `F-005`'s countdown arriving. Telling the operator
      // their account is unreadable sends them looking at their account.
      vi.mocked(authService.me).mockRejectedValue(new NotFoundError('No handler for /auth/me'))

      await expect(authenticateAdmin(ADMIN_EMAIL, '123456')).rejects.toThrow(
        IDENTITY_ROUTE_MISSING_ERROR,
      )
    })

    it('says the session was refused on a 401', async () => {
      vi.mocked(authService.me).mockRejectedValue(new UnauthorizedError('Token is not valid'))

      await expect(authenticateAdmin(ADMIN_EMAIL, '123456')).rejects.toThrow(
        IDENTITY_REFUSED_ERROR,
      )
    })

    it('does not leave the token installed on the client', async () => {
      // `F-015`. The token has to be set before `/auth/me` can be asked with it, so a failed
      // read left a live bearer token on a client whose sign-in was reported as failed.
      vi.mocked(authService.me).mockRejectedValue(new NotFoundError('No handler for /auth/me'))

      await expect(authenticateAdmin(ADMIN_EMAIL, '123456')).rejects.toThrow()

      expect(setToken).toHaveBeenLastCalledWith(null)
    })
  })
})

describe('getRequestCodeErrorMessage', () => {
  const FALLBACK = 'Could not send login code'

  it('says to wait when the request was rate-limited', () => {
    // What the client produces for a 429 with no message of its own — it names our endpoint
    // and a status, which tells the operator nothing about what to do next.
    const rateLimited = new RateLimitedError('Request to /auth/request-login failed with status 429')

    expect(getRequestCodeErrorMessage(rateLimited, FALLBACK)).toBe(CODE_RATE_LIMITED_ERROR)
  })

  it('keeps every other refusal as the backend worded it', () => {
    const refused = new BadRequestError('That address is not a KIT address.')

    expect(getRequestCodeErrorMessage(refused, FALLBACK)).toBe('That address is not a KIT address.')
  })
})
