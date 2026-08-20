import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiClient, ApiError } from './ApiClient'
import { AuthService } from './AuthService'
import { jsonResponse, TEST_API_BASE_URL } from '../test/http'

const fetchMock = vi.fn()

function createAuthService() {
  return new AuthService(new ApiClient(TEST_API_BASE_URL))
}

describe('AuthService', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  it('requests a one-time login code for the given email', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, message: 'Code sent' }))
    const service = createAuthService()

    await expect(service.requestLoginCode('admin@student.kit.edu')).resolves.toEqual({
      success: true,
      message: 'Code sent',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_API_BASE_URL}/auth/request-login`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'admin@student.kit.edu' }),
      })
    )
  })

  it('exchanges an email and login code for an auth token', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, message: 'OK', authToken: 'mock-token-1' }))
    const service = createAuthService()

    await expect(service.login('admin@student.kit.edu', '123456')).resolves.toEqual({
      token: 'mock-token-1',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_API_BASE_URL}/auth/login`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'admin@student.kit.edu', loginToken: '123456' }),
      })
    )
  })

  it('rejects unsuccessful login responses with the backend message', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: false, message: 'Invalid login code', authToken: '' }))
    const service = createAuthService()

    await expect(service.login('admin@student.kit.edu', 'wrong-code')).rejects.toThrow('Invalid login code')
  })

  it('requests revocation of the current admin session', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, message: 'Logged out successfully' }))
    const client = new ApiClient(TEST_API_BASE_URL)
    client.setToken('admin-token')
    const service = new AuthService(client)

    await expect(service.logout()).resolves.toEqual({
      success: true,
      message: 'Logged out successfully',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_API_BASE_URL}/auth/logout`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer admin-token',
        }),
      })
    )
  })
  it('reports the signed-in user when /auth/me carries one', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      success: true,
      message: 'OK',
      user: { id: 'admin-1', name: 'Admin User', email: 'admin@student.kit.edu', role: 'ADMIN' },
    }))
    const service = createAuthService()

    const session = await service.me()

    expect(session.user).toEqual({
      id: 'admin-1',
      name: 'Admin User',
      email: 'admin@student.kit.edu',
      role: 'ADMIN',
    })
    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_API_BASE_URL}/auth/me`,
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('resolves without a user when /auth/me confirms the token but names nobody', async () => {
    // The shape the login path falls back on: the token is good, but the identity has to be
    // found elsewhere. Confirming the session must not fail just because `user` is absent.
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, message: 'Authenticated' }))
    const service = createAuthService()

    await expect(service.me()).resolves.toEqual({ success: true, message: 'Authenticated' })
  })

  it('rejects a refused token with a 401 ApiError', async () => {
    // The status, not the message, is what ends a session — anything else is treated as the
    // backend being unreachable and leaves the session alone.
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: false, message: 'Token expired' }, 401))
    const service = createAuthService()

    const refusal = await service.me().catch((error: unknown) => error)

    expect(refusal).toBeInstanceOf(ApiError)
    expect(refusal).toMatchObject({ status: 401, message: 'Token expired' })
  })
})
