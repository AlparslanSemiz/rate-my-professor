import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiClient, ContractError, expectArray, NetworkError, RefusedError } from './ApiClient'
import { jsonResponse, TEST_API_BASE_URL } from '@/test/http'

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

    const failure = await client.patch('/users/1/block').catch((error: unknown) => error)
    expect(failure).toBeInstanceOf(RefusedError)
    expect(failure).toMatchObject({ status: 200, message: 'Admins cannot be blocked.' })
    // A refusal the backend chose to serve as a 2xx will refuse again, whatever the status says.
    expect((failure as RefusedError).transient).toBe(false)
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

  it('reports a transport failure as a NetworkError, without blaming the connection alone', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const client = new ApiClient(TEST_API_BASE_URL)

    const failure = await client.get('/users').catch((error: unknown) => error)
    expect(failure).toBeInstanceOf(NetworkError)
    expect((failure as NetworkError).message).toContain('refusing requests from this origin')
    // The browser's own TypeError explains nothing to an operator, so it is carried as
    // `cause` for the console instead of being discarded.
    expect((failure as NetworkError).cause).toBeInstanceOf(TypeError)
    // An unreachable host may come back; this is the one failure worth retrying.
    expect((failure as NetworkError).transient).toBe(true)
  })

  it('rejects empty successful responses with a readable error', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 200 }))
    const client = new ApiClient(TEST_API_BASE_URL)

    const failure = await client.get('/users').catch((error: unknown) => error)
    expect(failure).toBeInstanceOf(ContractError)
    expect((failure as ContractError).message).toBe('The server returned an empty response.')
  })

  it('reports a body it cannot parse as a ContractError, not as a retryable failure', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{invalid json', { status: 200 }))
    const client = new ApiClient(TEST_API_BASE_URL)

    const failure = await client.get('/users').catch((error: unknown) => error)
    expect(failure).toBeInstanceOf(ContractError)
    expect((failure as ContractError).message).toBe('The server returned an invalid JSON response.')
    // This used to arrive as `status: 0`, which the retry predicate read as "not a 4xx" and
    // repeated twice for nothing.
    expect((failure as ContractError).transient).toBe(false)
  })
})

describe('expectArray', () => {
  it('returns the list when the field holds one', () => {
    expect(expectArray<number>({ users: [1, 2] }, 'users', 'GET /users')).toEqual([1, 2])
  })

  it('throws a readable ContractError naming the endpoint and the missing field', () => {
    expect(() => expectArray({ success: true }, 'users', 'GET /users')).toThrowError(
      /GET \/users did not return a "users" list/
    )
  })

  it('throws rather than letting a non-array through', () => {
    expect(() => expectArray({ users: null }, 'users', 'GET /users')).toThrowError(/"users" list/)
  })
})
