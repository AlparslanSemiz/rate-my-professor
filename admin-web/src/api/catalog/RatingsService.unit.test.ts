import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiClient } from '@/api/client/ApiClient'
import { RatingsService } from './RatingsService'
import { jsonResponse, TEST_API_BASE_URL } from '@/test/http'

const fetchMock = vi.fn()

function createRatingsService() {
  return new RatingsService(new ApiClient(TEST_API_BASE_URL))
}

/**
 * Read and delete only: a rating is someone's own assessment, so there is no edit call to
 * cover. The listing's field names come from the backend's brief and have not been read from
 * a live response yet, which is why the mapper tolerates their absence.
 */
describe('RatingsService', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  it('lists ratings for one lecture, a page at a time', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      success: true,
      message: 'OK',
      ratings: [
        {
          id: 'rating-1',
          lectureId: 'lecture-1',
          createdAt: '2026-06-01T10:00:00Z',
          author: { id: 'user-1', name: 'Alice Smith' },
          scores: { CONTENT: 5 },
        },
      ],
      nextCursor: 'cursor-1',
    }))
    const service = createRatingsService()

    await expect(service.list({ limit: 50, lectureId: 'lecture-1' })).resolves.toEqual({
      ratings: [
        {
          id: 'rating-1',
          lectureId: 'lecture-1',
          authorName: 'Alice Smith',
          createdAt: '2026-06-01T10:00:00Z',
          scores: { CONTENT: 5 },
        },
      ],
      nextCursor: 'cursor-1',
    })

    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toBe(`${TEST_API_BASE_URL}/ratings?limit=50&lectureId=lecture-1`)
  })

  it('names an author the backend did not name, rather than rendering nothing', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      success: true,
      message: 'OK',
      ratings: [{ id: 'rating-1' }],
    }))
    const service = createRatingsService()

    await expect(service.list()).resolves.toMatchObject({
      ratings: [{ authorName: 'Unknown', lectureId: null, scores: {} }],
      nextCursor: null,
    })
  })

  it('deletes a rating by its own id', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, message: 'Deleted rating successfully' }))
    const service = createRatingsService()

    await expect(service.delete('rating-1')).resolves.toEqual({
      success: true,
      message: 'Deleted rating successfully',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_API_BASE_URL}/ratings/rating-1`,
      expect.objectContaining({ method: 'DELETE' })
    )
  })

  it('surfaces a refusal from the backend', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: false, message: 'Rating not found' }, 404))
    const service = createRatingsService()

    await expect(service.delete('missing-rating')).rejects.toThrow('Rating not found')
  })
})
