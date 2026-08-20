import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiClient } from './ApiClient'
import { RatingsService } from './RatingsService'
import { jsonResponse, TEST_API_BASE_URL } from '../test/http'

const fetchMock = vi.fn()

function createRatingsService() {
  return new RatingsService(new ApiClient(TEST_API_BASE_URL))
}

/**
 * There is no screen behind this service yet — the backend has no admin listing of individual
 * ratings to take an id from. The call is still covered so the one thing it does is known to
 * work the day that listing exists.
 */
describe('RatingsService', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
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
