import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiClient } from './ApiClient'

const API_BASE_URL = 'https://api.test'
const fetchMock = vi.fn()

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('ApiClient', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  it('sends the stored auth token as a bearer token', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, message: 'OK' }))
    const client = new ApiClient(API_BASE_URL)
    client.setToken('auth-token-1')

    await client.get('/users')

    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE_URL}/users`,
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
    const client = new ApiClient(API_BASE_URL)
    client.setToken('expired-token')
    client.setOnUnauthorized(onUnauthorized)

    await expect(client.get('/users')).rejects.toThrow('Unauthorized')

    expect(onUnauthorized).toHaveBeenCalledOnce()
  })
})
