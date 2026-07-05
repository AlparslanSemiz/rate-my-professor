import { describe, expect, it, vi } from 'vitest'

async function loadUsersApi() {
  vi.resetModules()
  return import('./users')
}

async function finishRequest<T>(promise: Promise<T>, delay: number) {
  const settled = promise.then(
    (value) => ({ status: 'fulfilled' as const, value }),
    (error: unknown) => ({ status: 'rejected' as const, error })
  )

  await vi.advanceTimersByTimeAsync(delay)
  const result = await settled
  if (result.status === 'rejected') throw result.error
  return result.value
}

describe('users api', () => {
  it('returns a defensive users array copy', async () => {
    vi.useFakeTimers()
    const { getUsers } = await loadUsersApi()

    const firstResult = await finishRequest(getUsers(), 400)
    firstResult.pop()

    const secondResult = await finishRequest(getUsers(), 400)

    expect(firstResult).toHaveLength(5)
    expect(secondResult).toHaveLength(6)
  })

  it('deletes existing users and rejects missing ids', async () => {
    vi.useFakeTimers()
    const { deleteUser, getUsers } = await loadUsersApi()

    await finishRequest(deleteUser(2), 300)

    const remainingUsers = await finishRequest(getUsers(), 400)
    expect(remainingUsers.map((user) => user.id)).not.toContain(2)

    await expect(finishRequest(deleteUser(999), 300)).rejects.toThrow(
      'User with id 999 not found'
    )
  })
})
