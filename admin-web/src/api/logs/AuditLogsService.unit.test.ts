import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiClient } from '@/api/client/ApiClient'
import { AuditLogsService } from './AuditLogsService'
import type { AuditLog } from './index'
import { jsonResponse, TEST_API_BASE_URL } from '@/test/http'

const fetchMock = vi.fn()

const auditLog: AuditLog = {
  id: 'audit-1',
  action: 'USER_BLOCKED',
  createdAt: '2026-07-23T10:00:00.000Z',
  actor: {
    type: 'ADMIN',
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@student.kit.edu',
    role: 'ADMIN',
  },
  target: {
    type: 'USER',
    id: 'user-1',
    label: 'Alice (alice@student.kit.edu)',
  },
  changes: {
    status: { before: 'ACTIVE', after: 'BLOCKED' },
  },
  metadata: {},
  revertible: true,
  revertBlockedReason: null,
  revertedByAuditId: null,
}

function createService() {
  return new AuditLogsService(new ApiClient(TEST_API_BASE_URL))
}

/**
 * The panel sends the operator's local day, so the expected bounds are derived the same way
 * rather than hard-coded — otherwise the test only passes in the timezone it was written in.
 */
function localDayRange(from: string, to: string) {
  const [fromYear, fromMonth, fromDay] = from.split('-').map(Number)
  const [toYear, toMonth, toDay] = to.split('-').map(Number)
  return {
    from: new Date(fromYear, fromMonth - 1, fromDay, 0, 0, 0, 0).toISOString(),
    to: new Date(toYear, toMonth - 1, toDay, 23, 59, 59, 999).toISOString(),
  }
}

describe('AuditLogsService', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  it('loads a cursor page with server-side filters', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      success: true,
      message: 'Success',
      auditLogs: [auditLog],
      nextCursor: 'next-page',
    }))
    const service = createService()

    await expect(service.getLogs({
      q: 'Alice',
      actorId: 'admin-1',
      action: 'USER_BLOCKED',
      targetType: 'USER',
      from: '2026-07-01',
      to: '2026-07-23',
    }, 'current-page')).resolves.toEqual({
      entries: [auditLog],
      nextCursor: 'next-page',
    })

    const range = localDayRange('2026-07-01', '2026-07-23')
    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_API_BASE_URL}/audit-logs?limit=50&cursor=current-page&q=Alice&actorId=admin-1&action=USER_BLOCKED&targetType=USER&from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`,
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('loads audit filter metadata', async () => {
    const response = {
      success: true,
      message: 'Success',
      actors: [{
        id: 'admin-1',
        name: 'Admin User',
        email: 'admin@student.kit.edu',
        role: 'ADMIN',
      }],
      actions: ['ADMIN_LOGIN'],
      targetTypes: ['ADMIN_SESSION'],
      actorTypes: ['ADMIN'],
    }
    fetchMock.mockResolvedValueOnce(jsonResponse(response))
    const service = createService()

    await expect(service.getMeta()).resolves.toEqual({
      actors: response.actors,
      actions: response.actions,
      targetTypes: response.targetTypes,
      actorTypes: response.actorTypes,
    })
  })

  it('surfaces backend errors', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      success: false,
      message: 'Invalid audit cursor',
    }, 400))

    await expect(createService().getLogs({}, 'bad-cursor')).rejects.toThrow('Invalid audit cursor')
  })
  it('reverts an entry by its own id', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, message: 'Reverted USER_UPDATED' }))

    await expect(createService().revert('audit-1')).resolves.toMatchObject({ success: true })

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${TEST_API_BASE_URL}/audit-logs/audit-1/revert`)
    expect(init.method).toBe('POST')
  })

  it('carries the refusal reason of a rejected revert', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      success: false,
      message: 'The value changed after this entry, so reverting would discard that change',
      reason: 'VALUE_CHANGED',
    }, 409))

    // The reason is what the panel branches on; the message is what it would otherwise have
    // to pattern-match.
    await expect(createService().revert('audit-1')).rejects.toMatchObject({
      status: 409,
      reason: 'VALUE_CHANGED',
    })
  })

  it('reads an entry from a backend that says nothing about reverting as not revertible', async () => {
    const { revertible, revertBlockedReason, revertedByAuditId, ...withoutRevertFields } = auditLog
    void revertible
    void revertBlockedReason
    void revertedByAuditId
    fetchMock.mockResolvedValueOnce(jsonResponse({
      success: true,
      message: 'OK',
      auditLogs: [withoutRevertFields],
    }))

    const page = await createService().getLogs()

    expect(page.entries[0]).toMatchObject({
      revertible: false,
      revertBlockedReason: null,
      revertedByAuditId: null,
    })
  })

})
