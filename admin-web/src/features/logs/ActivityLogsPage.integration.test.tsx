import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import type { AuditEntry, AuditMeta } from '@/api/logs'
import { apiUrl } from '@/test/msw/apiUrl'
import { seedDb } from '@/test/msw/db'
import { failure, ok } from '@/test/msw/envelope'
import { requestsTo } from '@/test/msw/requests'
import { server, startMockBackend } from '@/test/msw/server'
import { withQueryClient } from '@/test/queryClient'
import ActivityLogsPage from './ActivityLogsPage'

/**
 * The activity log over the real request layer.
 *
 * Its sibling `AuditLogsPage.integration.test.tsx` covers what the two screens share; this
 * file is deliberately only what differs — the actor-type filter, the summary column, the
 * metadata-first details modal, and the undo that must not exist anywhere on it.
 */
startMockBackend()

const meta: AuditMeta = {
  actors: [
    { id: 'user-1', name: 'Mira Kowalski', email: 'mira@student.kit.edu', role: 'STUDENT' },
  ],
  actions: ['COMMENT_CREATED', 'ACCESS_REFUSED'],
  targetTypes: ['COMMENT', 'ENDPOINT'],
  actorTypes: ['ADMIN', 'USER'],
}

const contribution: AuditEntry = {
  id: 'activity-1',
  action: 'COMMENT_CREATED',
  createdAt: '2026-07-23T10:00:00.000Z',
  actor: {
    type: 'USER',
    id: 'user-1',
    name: 'Mira Kowalski',
    email: 'mira@student.kit.edu',
    role: 'STUDENT',
  },
  target: { type: 'COMMENT', id: 'comment-1', label: 'CS101 - Algorithms' },
  changes: {},
  metadata: { contentPreview: 'Clear and well paced', contentLength: 20 },
}

const refusal: AuditEntry = {
  ...contribution,
  id: 'activity-2',
  action: 'ACCESS_REFUSED',
  createdAt: '2026-07-23T09:00:00.000Z',
  target: { type: 'ENDPOINT', id: 'endpoint-1', label: '/users' },
  metadata: { method: 'GET', path: '/users', status: 403 },
}

function renderActivityLogs() {
  return render(<MantineProvider>{withQueryClient(<ActivityLogsPage />)}</MantineProvider>)
}

describe('Activity Logs page', () => {
  beforeEach(() => {
    seedDb({ activityMeta: meta, activityLogs: [contribution, refusal] })
  })

  it('summarises what happened from the metadata, not from the changed fields', async () => {
    renderActivityLogs()

    // An activity entry changes nothing, so the audit log's last column would read the same on
    // every row. The preview and the refused path are what actually differ.
    expect(await screen.findByText('Clear and well paced')).toBeInTheDocument()
    expect(screen.getByText('GET /users')).toBeInTheDocument()
  })

  it('offers no way to undo anything, anywhere on the screen', async () => {
    const user = userEvent.setup()
    renderActivityLogs()

    await user.click(await screen.findByRole('row', { name: /Open activity event Comment Created/ }))
    const dialog = await screen.findByRole('dialog')

    // The point of the assertion is the *absence*, so it is made three ways: no control, no
    // heading, and no explanation of why undoing is refused. A screen that grew any one of them
    // would be reading `revertible` off an entry type that does not have it.
    expect(within(dialog).queryByRole('button', { name: /undo/i })).not.toBeInTheDocument()
    expect(within(dialog).queryByText(/^Undo$/i)).not.toBeInTheDocument()
    expect(within(dialog).queryByText(/cannot be undone/i)).not.toBeInTheDocument()
  })

  it('shows the metadata as the detail, and says so when there is none', async () => {
    const user = userEvent.setup()
    seedDb({ activityMeta: meta, activityLogs: [{ ...contribution, metadata: {} }] })
    renderActivityLogs()

    await user.click(await screen.findByRole('row', { name: /Open activity event Comment Created/ }))

    const dialog = await screen.findByRole('dialog')
    // The audit log hides an empty metadata block; here metadata *is* the content, so its
    // absence is worth a sentence rather than a gap.
    expect(within(dialog).getByText('Nothing beyond the action itself.')).toBeInTheDocument()
    // And no before/after list: these entries have no fields to show either side of.
    expect(within(dialog).queryByText('Changes')).not.toBeInTheDocument()
  })

  it('sends the actor type the audit screen has no control for', async () => {
    const user = userEvent.setup()
    renderActivityLogs()
    await screen.findByText('Clear and well paced')

    await user.click(screen.getByRole('combobox', { name: 'Who' }))
    // Mantine's dropdown is never laid out under jsdom, so the option stays `display: none`.
    await user.click(await screen.findByRole('option', { name: 'User', hidden: true }))
    await user.click(screen.getByRole('button', { name: 'Apply filters' }))

    await waitFor(() => {
      const sent = requestsTo('GET', apiUrl('/activity-logs'))
      expect(sent.at(-1)?.path).toContain('actorType=USER')
    })
  })

  it('says the deployment has no activity endpoints, rather than reporting nothing found', async () => {
    server.use(http.get(apiUrl('/activity-logs'), () => failure(404, 'Not Found')))
    renderActivityLogs()

    // A `404` here is not "no entries" — it is a backend that never deployed the endpoints, and
    // the two read identically to an operator unless the screen says which.
    expect(
      await screen.findByText(/does not track application activity yet/),
    ).toBeInTheDocument()
  })

  it('reads its own log, not the audit one', async () => {
    renderActivityLogs()
    await screen.findByText('Clear and well paced')

    // The two screens share one reader. What stops them sharing a *page* is the resource and
    // the query key, and nothing else — so this asserts the request that actually went out.
    expect(requestsTo('GET', apiUrl('/activity-logs'))).not.toHaveLength(0)
    expect(requestsTo('GET', apiUrl('/audit-logs'))).toHaveLength(0)
  })

  it('shows the empty state when nothing matches', async () => {
    seedDb({ activityMeta: meta, activityLogs: [] })
    server.use(http.get(apiUrl('/activity-logs'), () => ok({ activityLogs: [], nextCursor: null })))
    renderActivityLogs()

    expect(await screen.findByText('No activity matches these filters.')).toBeInTheDocument()
  })
})
