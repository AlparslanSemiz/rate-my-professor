import { describe, expect, it, vi } from 'vitest'
import { ApiClient } from './ApiClient'
import { UsersService } from './UsersService'

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

function createUsersService() {
  return new UsersService(new ApiClient(null))
}

describe('UsersService', () => {
  it('returns a defensive users array copy', async () => {
    vi.useFakeTimers()
    const service = createUsersService()

    const firstResult = await finishRequest(service.getAll(), 400)
    firstResult.pop()
    firstResult[0].name = 'Mutated Name'

    const secondResult = await finishRequest(service.getAll(), 400)

    expect(firstResult).toHaveLength(6)
    expect(secondResult).toHaveLength(7)
    expect(secondResult[0].name).toBe('Alice Smith')
  })

  it('deletes existing users and rejects missing ids', async () => {
    vi.useFakeTimers()
    const service = createUsersService()

    await finishRequest(service.delete(2), 300)

    const remainingUsers = await finishRequest(service.getAll(), 400)
    expect(remainingUsers.map((user) => user.id)).not.toContain(2)

    await expect(finishRequest(service.delete(999), 300)).rejects.toThrow(
      'User with id 999 not found'
    )
  })

  it('rejects moderation actions for missing users', async () => {
    vi.useFakeTimers()
    const service = createUsersService()

    await expect(finishRequest(service.block(999), 300)).rejects.toThrow(
      'User with id 999 not found'
    )
    await expect(finishRequest(service.warn(999, 'Bad behavior'), 300)).rejects.toThrow(
      'User with id 999 not found'
    )
  })
})
