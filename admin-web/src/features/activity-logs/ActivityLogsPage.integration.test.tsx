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
  actions: ['COMMENT_CREATED', 'ACCESS_REFUSED'],
  targetTypes: ['COMMENT', 'ENDPOINT'],
  actorTypes: ['ADMIN', 'USER'],
}

const commentActivity: ActivityLog = {
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
  target: { type: 'COMMENT', id: 'comment-1', label: 'Re: Exam dates' },
  changes: {},
  metadata: { contentPreview: 'Clear and well paced', contentLength: 20 },
}

const refusedActivity: ActivityLog = {
  id: 'activity-2',
  action: 'ACCESS_REFUSED',
  createdAt: '2026-07-23T09:00:00.000Z',
  actor: {
    type: 'USER',
    id: 'user-2',
    name: 'Jonas',
    email: 'jonas@student.kit.edu',
    role: 'STUDENT',
  },
  target: { type: 'ENDPOINT', id: 'endpoint-1', label: 'GET /users' },
  changes: {},
  metadata: { method: 'GET', path: '/users/user-9', status: 403 },
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
      activityLogs: [commentActivity],
      nextCursor: null,
    })
  })

  it('shows activity and opens what was recorded behind an event', async () => {
    const user = userEvent.setup()
    renderActivityLogs()

    await user.click(await screen.findByRole('row', {
      name: 'Open activity Comment Created by MiraK',
    }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Activity Details')).toBeInTheDocument()
    expect(within(dialog).getByText('Re: Exam dates')).toBeInTheDocument()
    expect(within(dialog).getByText('Clear and well paced')).toBeInTheDocument()
  })

  it('marks a refused request and summarises what was refused', async () => {
    vi.mocked(activityLogsService.getLogs).mockResolvedValue({
      activityLogs: [refusedActivity],
      nextCursor: null,
    })
    renderActivityLogs()

    const row = await screen.findByRole('row', {
      name: 'Open activity Access Refused by Jonas',
    })
    expect(within(row).getByText('Access Refused')).toBeInTheDocument()
    expect(within(row).getByText('Endpoint')).toBeInTheDocument()
    expect(within(row).getByText('GET /users/user-9')).toBeInTheDocument()
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
      .mockResolvedValueOnce({ activityLogs: [commentActivity], nextCursor: 'next-page' })
      .mockResolvedValueOnce({ activityLogs: [refusedActivity], nextCursor: null })
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
      activityLogs: [],
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
