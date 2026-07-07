import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiClient } from './ApiClient'
import { AuthService } from './AuthService'

const API_BASE_URL = 'https://api.test'
const fetchMock = vi.fn()

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function createAuthService() {
  return new AuthService(new ApiClient(API_BASE_URL))
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
      `${API_BASE_URL}/auth/request-login`,
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
      `${API_BASE_URL}/auth/login`,
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
})
