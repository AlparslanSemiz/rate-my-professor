import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiClient } from './ApiClient'
import { jsonResponse, TEST_API_BASE_URL } from '../test/http'

const fetchMock = vi.fn()

describe('ApiClient', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  it('sends the stored auth token as a bearer token', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, message: 'OK' }))
    const client = new ApiClient(TEST_API_BASE_URL)
    client.setToken('auth-token-1')

    await client.get('/users')

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_API_BASE_URL}/users`,
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer auth-token-1',
          'Content-Type': 'application/json',
        }),
      })
    )
  })

  it('calls the unauthorized handler when an authenticated request receives 401', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: false, message: 'Unauthorized' }, 401))
    const onUnauthorized = vi.fn()
    const client = new ApiClient(TEST_API_BASE_URL)
    client.setToken('expired-token')
    client.setOnUnauthorized(onUnauthorized)

    await expect(client.get('/users')).rejects.toThrow('Unauthorized')

    expect(onUnauthorized).toHaveBeenCalledOnce()
  })

  it('rejects empty successful responses with a readable error', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 200 }))
    const client = new ApiClient(TEST_API_BASE_URL)

    await expect(client.get('/users')).rejects.toThrow('The server returned an empty response.')
  })

  it('wraps malformed successful JSON responses in an ApiError', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{invalid json', { status: 200 }))
    const client = new ApiClient(TEST_API_BASE_URL)

    await expect(client.get('/users')).rejects.toMatchObject({
      name: 'ApiError',
      status: 200,
      message: 'The server returned an invalid JSON response.',
    })
  })
})
