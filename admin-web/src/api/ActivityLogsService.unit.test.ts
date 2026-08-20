import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ActivityLogsService, type ActivityLog } from './ActivityLogsService'
import { ApiClient } from './ApiClient'
import { jsonResponse, TEST_API_BASE_URL } from '../test/http'

const fetchMock = vi.fn()

const activity: ActivityLog = {
  id: 'activity-1',
  action: 'COMMENT_CREATED',
  createdAt: '2026-07-23T10:00:00.000Z',
  actor: {
    type: 'USER',
    id: 'user-1',
    name: 'MiraK',
    email: 'mira@student.kit.edu',
    role: 'STUDENT',
  },
  target: {
    type: 'COMMENT',
    id: 'comment-1',
    label: 'CS101 — Algorithms',
  },
  changes: {},
  metadata: { contentPreview: 'Clear and well paced', contentLength: 20 },
}

function createService() {
  return new ActivityLogsService(new ApiClient(TEST_API_BASE_URL))
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

describe('ActivityLogsService', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  it('loads a cursor page with server-side filters', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      success: true,
      message: 'Success',
      activityLogs: [activity],
      nextCursor: 'next-page',
    }))

    await expect(createService().getLogs({
      q: 'Mira',
      actorId: 'user-1',
      actorType: 'USER',
      action: 'COMMENT_CREATED',
      targetType: 'COMMENT',
      from: '2026-07-01',
      to: '2026-07-23',
    }, 'current-page')).resolves.toEqual({
      activityLogs: [activity],
      nextCursor: 'next-page',
    })

    const range = localDayRange('2026-07-01', '2026-07-23')
    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_API_BASE_URL}/activity-logs?limit=50&cursor=current-page&q=Mira&actorId=user-1&actorType=USER&action=COMMENT_CREATED&targetType=COMMENT&from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`,
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('omits empty filters from the query string', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      success: true,
      message: 'Success',
      activityLogs: [],
      nextCursor: null,
    }))

    await createService().getLogs()

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_API_BASE_URL}/activity-logs?limit=50`,
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('loads activity filter metadata', async () => {
    const response = {
      success: true,
      message: 'Success',
      actors: [{ id: 'user-1', name: 'MiraK', email: 'mira@student.kit.edu', role: 'STUDENT' }],
      actions: ['USER_LOGIN', 'COMMENT_CREATED'],
      targetTypes: ['USER_SESSION', 'COMMENT'],
      actorTypes: ['ADMIN', 'USER'],
    }
    fetchMock.mockResolvedValueOnce(jsonResponse(response))

    await expect(createService().getMeta()).resolves.toEqual({
      actors: response.actors,
      actions: response.actions,
      targetTypes: response.targetTypes,
      actorTypes: response.actorTypes,
    })
  })

  it('tolerates a backend that omits the actor types', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      success: true,
      message: 'Success',
      actors: [],
      actions: [],
      targetTypes: [],
    }))

    await expect(createService().getMeta()).resolves.toMatchObject({ actorTypes: [] })
  })

  it('surfaces backend errors', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      success: false,
      message: 'Invalid activity cursor',
    }, 400))

    await expect(createService().getLogs({}, 'bad-cursor')).rejects.toThrow('Invalid activity cursor')
  })
})
