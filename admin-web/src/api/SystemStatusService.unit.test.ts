import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiClient } from './ApiClient'
import { SystemStatusService } from './SystemStatusService'
import { jsonResponse, TEST_API_BASE_URL } from '../test/http'

const fetchMock = vi.fn()

function createService() {
  return new SystemStatusService(new ApiClient(TEST_API_BASE_URL))
}

describe('SystemStatusService', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  it('reads the reported health, counters and last writes', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      success: true,
      message: 'Success',
      status: 'DEGRADED',
      checkedAt: '2026-07-28T13:40:00.000Z',
      version: '1.4.2',
      uptimeSeconds: 128400,
      database: { status: 'UP', latencyMs: 310, pendingMigrations: 1 },
      counts: { users: 412, blockedUsers: 4 },
      lastWriteAt: { USER_BLOCKED: '2026-07-28T12:11:00.000Z', USER_DELETED: null },
    }))

    await expect(createService().getStatus()).resolves.toEqual({
      status: 'DEGRADED',
      checkedAt: '2026-07-28T13:40:00.000Z',
      version: '1.4.2',
      uptimeSeconds: 128400,
      database: { status: 'UP', latencyMs: 310, pendingMigrations: 1 },
      counts: { users: 412, blockedUsers: 4 },
      lastWriteAt: { USER_BLOCKED: '2026-07-28T12:11:00.000Z', USER_DELETED: null },
    })

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_API_BASE_URL}/system/status`,
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('falls back to empty maps when the backend omits optional fields', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      success: true,
      message: 'Success',
      status: 'OK',
      checkedAt: '2026-07-28T13:40:00.000Z',
      database: { status: 'UP', latencyMs: 3, pendingMigrations: 0 },
    }))

    await expect(createService().getStatus()).resolves.toMatchObject({
      version: null,
      uptimeSeconds: null,
      counts: {},
      lastWriteAt: {},
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
