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

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_API_BASE_URL}/activity-logs?limit=50&cursor=current-page&q=Mira&actorId=user-1&actorType=USER&action=COMMENT_CREATED&targetType=COMMENT&from=2026-07-01T00%3A00%3A00.000Z&to=2026-07-23T23%3A59%3A59.999Z`,
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
