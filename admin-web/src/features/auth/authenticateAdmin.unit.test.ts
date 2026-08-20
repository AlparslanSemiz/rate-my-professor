import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authService } from '../../api/AuthService'
import { usersService, type User } from '../../api/UsersService'
import { authenticateAdmin, NOT_AN_ADMIN_ERROR } from './authenticateAdmin'

vi.mock('../../api/AuthService', () => ({
  authService: {
    login: vi.fn(),
    me: vi.fn(),
  },
}))

vi.mock('../../api/UsersService', () => ({
  usersService: {
    getAll: vi.fn(),
  },
}))

const ADMIN_EMAIL = 'u-kisi4@student.kit.edu'

const adminAccount: User = {
  id: 'admin-uuid-1',
  username: 'Alparslan',
  kitEmail: ADMIN_EMAIL,
  role: 'STUDENT',
  status: 'ACTIVE',
  joined: '2025-01-10',
  lastOnline: '2026-06-11T18:30:00Z',
  biography: 'Platform administrator.',
  warnings: 0,
  reports: 0,
}

describe('authenticateAdmin', () => {
  beforeEach(() => {
    vi.mocked(authService.login).mockResolvedValue({ token: 'mock-token-1' })
    vi.mocked(authService.me).mockResolvedValue({ success: true, message: 'Signed in' })
    vi.mocked(usersService.getAll).mockResolvedValue([adminAccount])
  })

  it('takes the identity from /auth/me and does not read the user list', async () => {
    vi.mocked(authService.me).mockResolvedValue({
      success: true,
      message: 'Signed in',
      user: { id: 'admin-uuid-1', name: 'Alparslan', email: ADMIN_EMAIL, role: 'ADMIN' },
    })

    const { user } = await authenticateAdmin(ADMIN_EMAIL, '123456')

    expect(user.id).toBe('admin-uuid-1')
    expect(usersService.getAll).not.toHaveBeenCalled()
  })

  it('falls back to the user list when /auth/me reports no user', async () => {
    const { user } = await authenticateAdmin(ADMIN_EMAIL, '123456')

    expect(usersService.getAll).toHaveBeenCalled()
    expect(user).toEqual({
      id: 'admin-uuid-1',
      name: 'Alparslan',
      email: ADMIN_EMAIL,
      // The account is a STUDENT to the backend; the panel's own admin list decides otherwise.
      role: 'ADMIN',
    })
  })

  it('falls back to the user list when /auth/me fails outright', async () => {
    vi.mocked(authService.me).mockRejectedValue(new Error('Not implemented'))

    const { user } = await authenticateAdmin(ADMIN_EMAIL, '123456')

    expect(user.id).toBe('admin-uuid-1')
  })

  /**
   * The panel used to invent an admin whose id was the email address, store it as the session
   * user, and send it back to the backend as `createdFrom.id` on every warning issued.
   */
  it('fails rather than inventing an identity when neither source answers', async () => {
    vi.mocked(usersService.getAll).mockRejectedValue(new Error('The server returned an empty response.'))

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
