import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiClient } from '@/api/client/ApiClient'
import { SystemStatusService } from './SystemStatusService'
import { jsonResponse, TEST_API_BASE_URL } from '@/test/http'

const fetchMock = vi.fn()

function createService() {
  return new SystemStatusService(new ApiClient(TEST_API_BASE_URL))
}

describe('SystemStatusService', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  it('reads the reported health, counters and last write', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      success: true,
      message: 'Success',
      status: 'OK',
      checkedAt: '2026-07-28T13:40:00.000Z',
      startedAt: '2026-07-27T02:00:00.000Z',
      uptimeSeconds: 128400,
      database: { reachable: true, latencyMs: 3, error: null },
      counts: { users: 412, admins: 6, openBugReports: 1 },
      lastWrite: {
        at: '2026-07-28T13:39:48.000Z',
        ageSeconds: 12,
        action: 'USER_BLOCKED',
        actorName: 'Administrator',
      },
    }))

    await expect(createService().getStatus()).resolves.toEqual({
      status: 'OK',
      checkedAt: '2026-07-28T13:40:00.000Z',
      startedAt: '2026-07-27T02:00:00.000Z',
      uptimeSeconds: 128400,
      database: { reachable: true, latencyMs: 3, error: null },
      // Narrowed to the four counters the panel reads, and `activeUsers` — which this
      // response does not carry — is null rather than zero. A counter that was not served is
      // not a counter that read zero.
      counts: { users: 412, activeUsers: null, admins: 6, openBugReports: 1 },
      lastWrite: {
        at: '2026-07-28T13:39:48.000Z',
        ageSeconds: 12,
        action: 'USER_BLOCKED',
        actorName: 'Administrator',
      },
      // Absent from this response: an integration the backend has not been given credentials
      // for is the same to the panel as one it has never heard of.
      gitlabEnabled: false,
    })

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_API_BASE_URL}/system/status`,
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('keeps counts and the last write null when the database could not be read', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      success: true,
      message: 'Success',
      status: 'DOWN',
      checkedAt: '2026-07-28T13:40:00.000Z',
      startedAt: '2026-07-27T02:00:00.000Z',
      uptimeSeconds: 128400,
      database: { reachable: false, latencyMs: null, error: 'CannotGetJdbcConnectionException' },
      counts: null,
      lastWrite: null,
    }))

    await expect(createService().getStatus()).resolves.toMatchObject({
      status: 'DOWN',
      counts: null,
      lastWrite: null,
      database: { reachable: false, error: 'CannotGetJdbcConnectionException' },
    })
  })

  it('falls back to nulls when the backend omits optional fields', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      success: true,
      message: 'Success',
      status: 'OK',
      checkedAt: '2026-07-28T13:40:00.000Z',
      database: { reachable: true, latencyMs: 3, error: null },
    }))

    await expect(createService().getStatus()).resolves.toMatchObject({
      startedAt: null,
      uptimeSeconds: null,
      counts: null,
      lastWrite: null,
      gitlabEnabled: false,
    })
  })

  it('surfaces backend errors', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      success: false,
      message: 'Could not authenticate Admin',
    }, 403))

    await expect(createService().getStatus()).rejects.toThrow('Could not authenticate Admin')
  })
})
