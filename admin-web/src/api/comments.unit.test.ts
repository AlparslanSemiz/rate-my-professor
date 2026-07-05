import { describe, expect, it, vi } from 'vitest'

async function loadCommentsApi() {
  vi.resetModules()
  return import('./comments')
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

describe('comments api', () => {
  it('loads reported comments with moderation metadata', async () => {
    vi.useFakeTimers()
    const { getReportedComments } = await loadCommentsApi()

    const reports = await finishRequest(getReportedComments(), 400)

    expect(reports).toHaveLength(4)
    expect(reports[0]).toMatchObject({
      id: 1,
      reason: 'Harassment',
      status: 'Pending',
      reportedBy: 'sarah_dev',
    })
  })

  it('updates report status in subsequent reads', async () => {
    vi.useFakeTimers()
    const { getReportedComments, updateCommentReportStatus } =
      await loadCommentsApi()

    await finishRequest(updateCommentReportStatus(1, 'Removed'), 300)

    const reports = await finishRequest(getReportedComments(), 400)
    expect(reports.find((report) => report.id === 1)?.status).toBe('Removed')
  })
})
