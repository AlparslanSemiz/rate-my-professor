import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AnswersService } from './AnswersService'
import { ApiClient } from '@/api/client/ApiClient'
import { jsonResponse, TEST_API_BASE_URL } from '@/test/http'

const fetchMock = vi.fn()

function createService() {
  return new AnswersService(new ApiClient(TEST_API_BASE_URL))
}

describe('AnswersService', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  it('loads every answer with its thread context', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      success: true,
      message: 'Successfully found all answers',
      answers: [
        {
          id: 'answer-1',
          content: 'Check the slides from week 3.',
          status: 'VISIBLE',
          author: { id: 'user-1', name: 'Mira', role: 'STUDENT', warnings: 0, status: 'ACTIVE' },
          commentId: 'comment-1',
          commentPreview: 'When is the exam?',
          postContext: 'CS101 - Algorithms',
          reports: 0,
          createdAt: '2026-07-23T10:00:00.000Z',
        },
      ],
    }))

    await expect(createService().getAll()).resolves.toMatchObject([
      { id: 'answer-1', commentPreview: 'When is the exam?', status: 'VISIBLE' },
    ])
  })

  it('loads reported answers with the parent comment as context', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      success: true,
      message: 'Successfully found all reported answers',
      answers: [
        {
          id: 'report-1',
          answerContent: 'Reported reply',
          commentContent: 'When is the exam?',
          postContext: 'CS101 - Algorithms',
          reportText: '',
          reportedUser: { id: 'user-1', name: 'Mira', role: 'STUDENT', warnings: 1, status: 'ACTIVE' },
          reporter: { id: 'user-2', name: 'Jonas', role: 'STUDENT', warnings: 0, status: 'ACTIVE' },
          reason: 'SPAM',
          status: 'OPEN',
          date: '2026-07-23T10:00:00.000Z',
        },
      ],
    }))

    await expect(createService().getReported()).resolves.toMatchObject([
      { id: 'report-1', answerContent: 'Reported reply', commentContent: 'When is the exam?' },
    ])
  })

  it('edits an answer with only the supplied fields', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, message: 'Updated answer successfully' }))

    await createService().update('answer-1', { status: 'HIDDEN' })

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${TEST_API_BASE_URL}/answers/answer-1`)
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(init.body as string)).toEqual({ status: 'HIDDEN' })
  })

  it('separates deleting an answer from withdrawing its report', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ success: true, message: 'Deleted answer successfully' }))
      .mockResolvedValueOnce(jsonResponse({ success: true, message: 'Deleted report successfully' }))
    const service = createService()

    await service.delete('answer-1')
    await service.deleteReport('report-1')

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      `${TEST_API_BASE_URL}/answers/answer-1`,
      expect.objectContaining({ method: 'DELETE' })
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `${TEST_API_BASE_URL}/answers/reported/report-1`,
      expect.objectContaining({ method: 'DELETE' })
    )
  })

  it('updates a report status through the reported path', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, message: 'Updated' }))

    await createService().updateStatus('report-1', 'ACTION_TAKEN')

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${TEST_API_BASE_URL}/answers/reported/report-1`)
    expect(JSON.parse(init.body as string)).toEqual({ status: 'ACTION_TAKEN' })
  })

  it('surfaces backend errors', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: false, message: 'Answer not found' }, 404))

    await expect(createService().delete('missing')).rejects.toThrow('Answer not found')
  })
})
