import { describe, expect, it, vi } from 'vitest'
import { ApiClient } from './ApiClient'
import { CommentsService } from './CommentsService'

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

function createCommentsService() {
  return new CommentsService(new ApiClient(null))
}

describe('CommentsService', () => {
  it('loads reported comments with moderation metadata', async () => {
    vi.useFakeTimers()
    const service = createCommentsService()

    const reports = await finishRequest(service.getReported(), 400)

    expect(reports).toHaveLength(4)
    expect(reports[0]).toMatchObject({
      id: 1,
      reason: 'Harassment',
      status: 'Pending',
      reportedUser: {
        name: 'Carol White',
      },
      reportingUser: {
        name: 'Bob Johnson',
      },
    })
  })

  it('updates report status in subsequent reads', async () => {
    vi.useFakeTimers()
    const service = createCommentsService()

    await finishRequest(service.updateStatus(1, 'Removed'), 300)

    const reports = await finishRequest(service.getReported(), 400)
    expect(reports.find((report) => report.id === 1)?.status).toBe('Removed')
  })

  it('rejects status updates for missing comment reports', async () => {
    vi.useFakeTimers()
    const service = createCommentsService()

    await expect(finishRequest(service.updateStatus(999, 'Removed'), 300)).rejects.toThrow(
      'Comment report with id 999 not found'
    )
  })
})
