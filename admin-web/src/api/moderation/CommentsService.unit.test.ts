import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiClient } from '@/api/client/ApiClient'
import { CommentsService } from './CommentsService'
import { jsonResponse, TEST_API_BASE_URL } from '@/test/http'

const fetchMock = vi.fn()

function createCommentsService() {
  return new CommentsService(new ApiClient(TEST_API_BASE_URL))
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
    expect(url).toBe(`${TEST_API_BASE_URL}/comments/reported/comment-1`)
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(init.body as string)).toEqual({ status: 'ACTION_TAKEN' })
  })

  it('loads every comment, not only the reported ones', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      success: true,
      message: 'Successfully found all comments',
      comments: [
        {
          id: 'comment-1',
          content: 'Great lecture',
          status: 'VISIBLE',
          author: { id: 'user-1', name: 'Mira', role: 'STUDENT', warnings: 0, status: 'ACTIVE' },
          postContext: 'CS101 - Algorithms',
          lectureId: 'lecture-1',
          answers: 2,
          reports: 0,
          createdAt: '2026-07-23T10:00:00.000Z',
        },
      ],
    }))
    const service = createCommentsService()

    await expect(service.getAll()).resolves.toMatchObject([
      { id: 'comment-1', status: 'VISIBLE', answers: 2 },
    ])
    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_API_BASE_URL}/comments`,
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('edits a comment with only the supplied fields', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, message: 'Updated comment successfully' }))
    const service = createCommentsService()

    await service.update('comment-1', { content: 'Corrected' })

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${TEST_API_BASE_URL}/comments/comment-1`)
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(init.body as string)).toEqual({ content: 'Corrected' })
  })

  it('deletes the comment and withdraws a report through different paths', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ success: true, message: 'Deleted comment successfully' }))
      .mockResolvedValueOnce(jsonResponse({ success: true, message: 'Deleted report successfully' }))
    const service = createCommentsService()

    await service.delete('comment-1')
    await service.deleteReport('report-1')

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      `${TEST_API_BASE_URL}/comments/comment-1`,
      expect.objectContaining({ method: 'DELETE' })
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `${TEST_API_BASE_URL}/comments/reported/report-1`,
      expect.objectContaining({ method: 'DELETE' })
    )
  })

  it('surfaces backend errors for missing comment reports', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: false, message: 'Comment report not found' }, 404))
    const service = createCommentsService()

    await expect(service.updateStatus('missing-comment', 'DISMISSED')).rejects.toThrow('Comment report not found')
  })
})
