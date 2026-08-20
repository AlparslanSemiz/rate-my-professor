import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiClient, expectArray } from './ApiClient'
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
        headers: expect.objectContaining({ Authorization: 'Bearer auth-token-1' }),
      })
    )
  })

  it('declares a JSON content type only when the request carries a body', async () => {
    // A Response body can only be read once, so each call needs its own.
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, message: 'OK' }))
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, message: 'OK' }))
    const client = new ApiClient(TEST_API_BASE_URL)

    await client.get('/users')
    const [, getInit] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(getInit.headers).not.toHaveProperty('Content-Type')

    await client.patch('/users/1', { username: 'x' })
    const [, patchInit] = fetchMock.mock.calls[1] as [string, RequestInit]
    expect(patchInit.headers).toHaveProperty('Content-Type', 'application/json')
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

  it('adds defined GET query parameters and omits empty values', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, message: 'OK' }))
    const client = new ApiClient(TEST_API_BASE_URL)

    await client.get('/audit-logs', {
      limit: 50,
      action: 'ADMIN_LOGIN',
      cursor: null,
      q: '',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_API_BASE_URL}/audit-logs?limit=50&action=ADMIN_LOGIN`,
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('rejects a 2xx body that reports success: false, carrying the backend message', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ success: false, message: 'Admins cannot be blocked.' })
    )
    const client = new ApiClient(TEST_API_BASE_URL)

    await expect(client.patch('/users/1/block')).rejects.toMatchObject({
      name: 'ApiError',
      status: 200,
      message: 'Admins cannot be blocked.',
    })
  })

  it('falls back to a generic refusal when success is false without a message', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: false }))
    const client = new ApiClient(TEST_API_BASE_URL)

    await expect(client.delete('/users/1')).rejects.toThrow('The server refused the request.')
  })

  it('accepts a 2xx body that reports success: true', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, message: 'Blocked' }))
    const client = new ApiClient(TEST_API_BASE_URL)

    await expect(client.patch('/users/1/block')).resolves.toEqual({
      success: true,
      message: 'Blocked',
    })
  })

  it('reports a transport failure without blaming the connection alone', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const client = new ApiClient(TEST_API_BASE_URL)

    await expect(client.get('/users')).rejects.toMatchObject({
      name: 'ApiError',
      status: 0,
      message: expect.stringContaining('refusing requests from this origin'),
    })
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

describe('expectArray', () => {
  it('returns the list when the field holds one', () => {
    expect(expectArray<number>({ users: [1, 2] }, 'users', 'GET /users')).toEqual([1, 2])
  })

  it('throws a readable ApiError naming the endpoint and the missing field', () => {
    expect(() => expectArray({ success: true }, 'users', 'GET /users')).toThrowError(
      /GET \/users did not return a "users" list/
    )
  })

  it('throws rather than letting a non-array through', () => {
    expect(() => expectArray({ users: null }, 'users', 'GET /users')).toThrowError(/"users" list/)
  })
})
