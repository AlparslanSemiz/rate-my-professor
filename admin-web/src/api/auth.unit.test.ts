import { describe, expect, it, vi } from 'vitest'
import { loginRequest } from './auth'

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

describe('loginRequest', () => {
  it('returns a token and public user profile for valid credentials', async () => {
    vi.useFakeTimers()

    const response = await finishLogin(
      loginRequest('admin@example.com', 'admin123')
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

    await expect(
      finishLogin(loginRequest('admin@example.com', 'wrong-password'))
    ).rejects.toThrow('Invalid email or password')
  })
})
