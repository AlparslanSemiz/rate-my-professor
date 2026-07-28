import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  activityLogsService,
  type ActivityLog,
  type ActivityMeta,
} from '../../api/ActivityLogsService'
import { ApiError } from '../../api/ApiClient'
import ActivityLogsPage from './ActivityLogsPage'

vi.mock('../../api/ActivityLogsService', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../api/ActivityLogsService')>()
  return {
    ...original,
    activityLogsService: {
      getLogs: vi.fn(),
      getMeta: vi.fn(),
    },
  }
})

const meta: ActivityMeta = {
  actors: [{ id: 'user-1', name: 'MiraK', email: 'mira@student.kit.edu', role: 'STUDENT' }],
  types: ['COMMENT_CREATED', 'ADMIN_ACCESS_DENIED'],
  targetTypes: ['COMMENT', 'ADMIN_ENDPOINT'],
  outcomes: ['SUCCESS', 'FAILURE', 'DENIED'],
}

const commentActivity: ActivityLog = {
  id: 'activity-1',
  type: 'COMMENT_CREATED',
  createdAt: '2026-07-23T10:00:00.000Z',
  actor: {
    type: 'USER',
    id: 'user-1',
    name: 'MiraK',
    email: 'mira@student.kit.edu',
    role: 'STUDENT',
  },
  target: { type: 'COMMENT', id: 'comment-1', label: 'Re: Exam dates' },
  context: { route: '/posts/1/comments', method: 'POST', ip: '192.0.2.13', userAgent: 'Firefox' },
  metadata: { length: 128 },
  outcome: 'SUCCESS',
}

const deniedActivity: ActivityLog = {
  id: 'activity-2',
  type: 'ADMIN_ACCESS_DENIED',
  createdAt: '2026-07-23T09:00:00.000Z',
  actor: null,
  target: { type: 'ADMIN_ENDPOINT', id: '/users', label: 'GET /users' },
  context: { route: '/users', method: 'GET', ip: null, userAgent: null },
  metadata: {},
  outcome: 'DENIED',
}

function renderActivityLogs() {
  return render(
    <MantineProvider>
      <ActivityLogsPage />
    </MantineProvider>
  )
}

describe('Activity Log page', () => {
  beforeEach(() => {
    vi.mocked(activityLogsService.getMeta).mockResolvedValue(meta)
    vi.mocked(activityLogsService.getLogs).mockResolvedValue({
      activities: [commentActivity],
      nextCursor: null,
    })
  })

  it('shows activity and opens the request context behind an event', async () => {
    const user = userEvent.setup()
    renderActivityLogs()

    await user.click(await screen.findByRole('row', {
      name: 'Open activity Comment Created by MiraK',
    }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Activity Details')).toBeInTheDocument()
    expect(within(dialog).getByText('Re: Exam dates')).toBeInTheDocument()
    expect(within(dialog).getByText('/posts/1/comments')).toBeInTheDocument()
    expect(within(dialog).getByText('192.0.2.13')).toBeInTheDocument()
  })

  it('labels unauthenticated events as anonymous', async () => {
    vi.mocked(activityLogsService.getLogs).mockResolvedValue({
      activities: [deniedActivity],
      nextCursor: null,
    })
    renderActivityLogs()

    const row = await screen.findByRole('row', {
      name: 'Open activity Admin Access Denied by Anonymous',
    })
    expect(within(row).getByText('Anonymous')).toBeInTheDocument()
    expect(within(row).getByText('Not signed in')).toBeInTheDocument()
    expect(within(row).getByText('Denied')).toBeInTheDocument()
  })

  it('applies server-side filters', async () => {
    const user = userEvent.setup()
    renderActivityLogs()
    await screen.findByText('Re: Exam dates')

    await user.type(screen.getByRole('textbox', { name: 'Search' }), 'Mira')
    await user.click(screen.getByRole('button', { name: 'Apply filters' }))

    await waitFor(() => {
      expect(activityLogsService.getLogs).toHaveBeenLastCalledWith(expect.objectContaining({
        q: 'Mira',
      }))
    })
  })

  it('appends the next cursor page', async () => {
    vi.mocked(activityLogsService.getLogs)
      .mockResolvedValueOnce({ activities: [commentActivity], nextCursor: 'next-page' })
      .mockResolvedValueOnce({ activities: [deniedActivity], nextCursor: null })
    const user = userEvent.setup()
    renderActivityLogs()

    await user.click(await screen.findByRole('button', { name: 'Load more' }))

    await waitFor(() =>
      expect(activityLogsService.getLogs).toHaveBeenLastCalledWith({}, 'next-page')
    )
    expect(await screen.findByText('GET /users')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument()
  })

  it('shows an empty state when nothing matches', async () => {
    vi.mocked(activityLogsService.getLogs).mockResolvedValue({
      activities: [],
      nextCursor: null,
    })
    renderActivityLogs()

    expect(await screen.findByText('No activity matches these filters.')).toBeInTheDocument()
  })

  it('explains when the configured backend does not track activity yet', async () => {
    vi.mocked(activityLogsService.getLogs).mockRejectedValue(new ApiError(404, 'Not found'))
    renderActivityLogs()

    expect(await screen.findByText(
      'The configured backend does not track application activity yet. Deploy the activity log API endpoints, then try again.'
    )).toBeInTheDocument()
    expect(screen.queryByText('Not found')).not.toBeInTheDocument()
  })
})
