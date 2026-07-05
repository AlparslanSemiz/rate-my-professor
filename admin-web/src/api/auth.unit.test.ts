import { describe, expect, it, vi } from 'vitest'
import { ApiClient } from './ApiClient'
import { AuthService } from './AuthService'

async function finishLogin<T>(promise: Promise<T>) {
  const settled = promise.then(
    (value) => ({ status: 'fulfilled' as const, value }),
    (error: unknown) => ({ status: 'rejected' as const, error })
  )

  await vi.advanceTimersByTimeAsync(600)
  const result = await settled
  if (result.status === 'rejected') throw result.error
  return result.value
}

function createAuthService() {
  return new AuthService(new ApiClient(null))
}

describe('AuthService', () => {
  it('returns a token and public user profile for valid credentials', async () => {
    vi.useFakeTimers()
    const service = createAuthService()

    const response = await finishLogin(
      service.login('admin@example.com', 'admin123')
    )

    expect(response).toEqual({
      token: 'mock-token-1',
      user: {
        id: 1,
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'Admin',
      },
    })
    expect(response.user).not.toHaveProperty('password')
  })

  it('rejects invalid credentials', async () => {
    vi.useFakeTimers()
    const service = createAuthService()

    await expect(
      finishLogin(service.login('admin@example.com', 'wrong-password'))
    ).rejects.toThrow('Invalid email or password')
  })
})
