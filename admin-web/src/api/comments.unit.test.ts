import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiClient } from './ApiClient'
import { CommentsService } from './CommentsService'

const API_BASE_URL = 'https://api.test'
const fetchMock = vi.fn()

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function createCommentsService() {
  return new CommentsService(new ApiClient(API_BASE_URL))
}

describe('CommentsService', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  it('loads reported comments from the backend response', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      success: true,
      message: 'OK',
      comments: [
        {
          id: 'comment-1',
          commentContent: 'Reported text',
          postContext: 'Post title',
          reportText: 'Harassment report',
          reportedUser: { id: 'user-1', name: 'Carol White', role: 'STUDENT', warnings: 1, status: 'ACTIVE' },
          reporter: { id: 'user-2', name: 'Bob Johnson', role: 'ADMIN', warnings: 0, status: 'ACTIVE' },
          reason: 'HARASSMENT',
          status: 'OPEN',
          date: '2026-06-03T16:22:00Z',
        },
      ],
    }))
    const service = createCommentsService()

    const reports = await service.getReported()

    expect(reports).toHaveLength(1)
    expect(reports[0]).toMatchObject({
      id: 'comment-1',
      reason: 'HARASSMENT',
      status: 'OPEN',
      reportedUser: { name: 'Carol White' },
      reporter: { name: 'Bob Johnson' },
    })
  })

  it('updates report status with a PATCH request body', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, message: 'Updated' }))
    const service = createCommentsService()

    await service.updateStatus('comment-1', 'ACTION_TAKEN')

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${API_BASE_URL}/comments/reported/comment-1`)
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(init.body as string)).toEqual({ status: 'ACTION_TAKEN' })
  })

  it('surfaces backend errors for missing comment reports', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: false, message: 'Comment report not found' }, 404))
    const service = createCommentsService()

    await expect(service.updateStatus('missing-comment', 'DISMISSED')).rejects.toThrow('Comment report not found')
  })
})
