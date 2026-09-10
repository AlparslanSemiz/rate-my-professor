import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import type { AuditLog, AuditMeta } from '@/api/logs'
import { DEFAULT_PAGE_SIZE } from '@/api/client'
import { apiUrl } from '@/test/msw/apiUrl'
import { seedDb } from '@/test/msw/db'
import { failure, ok } from '@/test/msw/envelope'
import { requestsTo } from '@/test/msw/requests'
import { server, startMockBackend } from '@/test/msw/server'
import { without } from '@/test/msw/wire'
import { withQueryClient } from '@/test/queryClient'
import AuditLogsPage from './AuditLogsPage'

/**
 * The audit log over the real request layer.
 *
 * This screen is the one that filters and pages **server-side**, so what a test can prove
 * about either is entirely about the query string it produced — and under a service mock that
 * string was never built. "Applying a filter" was an assertion that a function had been called
 * with an object; here it is the `q=` that went out.
 */
startMockBackend()

const meta: AuditMeta = {
  actors: [{
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@student.kit.edu',
    role: 'ADMIN',
  }],
  actions: ['ADMIN_LOGIN', 'USER_BLOCKED'],
  targetTypes: ['ADMIN_SESSION', 'USER'],
  actorTypes: ['ADMIN'],
}

const firstLog: AuditLog = {
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
  metadata: {
    reason: 'Repeated abuse',
  },
  revertible: true,
  revertBlockedReason: null,
  revertedByAuditId: null,
}

const secondLog: AuditLog = {
  ...firstLog,
  id: 'audit-2',
  action: 'ADMIN_LOGIN',
  target: {
    type: 'ADMIN_SESSION',
    id: 'admin-1',
    label: 'Admin User admin session',
  },
  changes: {
    authenticated: { before: false, after: true },
  },
  metadata: {
    method: 'EMAIL_OTP',
  },
  // A sign-in is not a field edit, so there is nothing to put back.
  revertible: false,
  revertBlockedReason: 'ACTION_NOT_REVERTIBLE',
  revertedByAuditId: null,
}

function renderAuditLogs() {
  return render(
    <MantineProvider>{withQueryClient(<AuditLogsPage />)}</MantineProvider>
  )
}

describe('Audit Logs page', () => {
  beforeEach(() => {
    seedDb({ auditMeta: meta, auditLogs: [firstLog] })
  })

  it('shows audit events and opens their before/after details', async () => {
    const user = userEvent.setup()
    renderAuditLogs()

    await user.click(await screen.findByRole('row', {
      name: 'Open audit event User Blocked by Admin User',
    }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Audit Event Details')).toBeInTheDocument()
    expect(within(dialog).getByText('Alice (alice@student.kit.edu)')).toBeInTheDocument()
    expect(within(dialog).getByText('ACTIVE')).toBeInTheDocument()
    expect(within(dialog).getByText('BLOCKED')).toBeInTheDocument()
    expect(within(dialog).getByText('Repeated abuse')).toBeInTheDocument()
  })

  it('applies server-side search filters', async () => {
    const user = userEvent.setup()
    renderAuditLogs()
    await screen.findByText('Alice (alice@student.kit.edu)')

    await user.type(screen.getByRole('textbox', { name: 'Search' }), 'Alice')
    await user.click(screen.getByRole('button', { name: 'Apply filters' }))

    await waitFor(() => expect(requestsTo('GET', '/api/audit-logs')).toHaveLength(2))
    // The filter is a query parameter on a real request, not an argument to a double.
    expect(requestsTo('GET', '/api/audit-logs').at(-1)?.path).toContain('q=Alice')
  })

  it('keeps Apply and Clear out of the row the controls wrap in', async () => {
    renderAuditLogs()
    await screen.findByText('Alice (alice@student.kit.edu)')

    // `F-067`. Apply and Clear used to be the last two flex children of the same wrapping
    // group as the eight filter controls, so where they ended up was decided by how many
    // controls the screen happened to offer: at 1440 they sat on a second line here and on a
    // first line on Users. Their own row is what makes that impossible rather than unlikely.
    //
    // Asserted as containment rather than as a coordinate, because jsdom has no layout. The
    // browser measurement is in `docs/coursework/layout-audit.md`.
    const search = screen.getByRole('textbox', { name: 'Search' })
    const apply = screen.getByRole('button', { name: 'Apply filters' })
    const clear = screen.getByRole('button', { name: 'Clear' })

    const actionRow = apply.parentElement
    expect(actionRow).not.toBeNull()
    expect(actionRow).toContainElement(clear)
    expect(actionRow).not.toContainElement(search)
  })

  it('appends the next cursor page', async () => {
    // A full page and one more, because the handler really slices: with fewer entries than
    // the page size there is no second page to append, and a mock that simply returned two
    // canned responses proved the appending without anything having been paged.
    const filler = Array.from({ length: DEFAULT_PAGE_SIZE - 1 }, (_, index) => ({
      ...firstLog,
      id: `audit-filler-${index}`,
    }))
    seedDb({ auditMeta: meta, auditLogs: [firstLog, ...filler, secondLog] })
    const user = userEvent.setup()
    renderAuditLogs()

    await user.click(await screen.findByRole('button', { name: 'Load more' }))

    await waitFor(() => expect(requestsTo('GET', '/api/audit-logs')).toHaveLength(2))
    // The cursor is the last id of the previous page, and the panel sends back what it was
    // given rather than an offset it computed — which is the contract in ADR 0006.
    expect(requestsTo('GET', '/api/audit-logs').at(-1)?.path).toContain(
      `cursor=${filler.at(-1)?.id}`,
    )
    expect(await screen.findByText('Admin User admin session')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument()
  })

  it('shows an empty state for filters with no matches', async () => {
    seedDb({ auditMeta: meta, auditLogs: [] })
    renderAuditLogs()

    expect(await screen.findByText('No audit events match these filters.')).toBeInTheDocument()
  })

  it('shows a retryable error when initial loading fails', async () => {
    server.use(
      http.get(apiUrl('/audit-logs'), () => failure(503, 'Audit service unavailable'), {
        once: true,
      }),
    )
    const user = userEvent.setup()
    renderAuditLogs()

    expect(await screen.findByText('Audit service unavailable')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByText('Alice (alice@student.kit.edu)')).toBeInTheDocument()
  })

  it('explains when the configured backend does not expose audit endpoints', async () => {
    server.use(http.get(apiUrl('/audit-logs'), () => failure(404, 'Not found')))
    renderAuditLogs()

    expect(await screen.findByText(
      'The configured backend does not support audit logs yet. Deploy the audit API endpoints, then try again.'
    )).toBeInTheDocument()
    expect(screen.queryByText('Not found')).not.toBeInTheDocument()
  })
  it('offers undo only where the backend says the entry can be undone', async () => {
    seedDb({ auditMeta: meta, auditLogs: [firstLog, secondLog] })
    const user = userEvent.setup()
    renderAuditLogs()

    await user.click(await screen.findByRole('row', {
      name: 'Open audit event Admin Login by Admin User',
    }))

    const dialog = within(await screen.findByRole('dialog'))
    expect(dialog.queryByRole('button', { name: 'Undo this change' })).not.toBeInTheDocument()
    // The backend's reason, in words an operator can act on.
    expect(dialog.getByText(/not a field edit/)).toBeInTheDocument()
  })

  it('undoes a change and re-reads the log afterwards', async () => {
    const user = userEvent.setup()
    renderAuditLogs()

    await user.click(await screen.findByRole('row', {
      name: 'Open audit event User Blocked by Admin User',
    }))
    await user.click(await screen.findByRole('button', { name: 'Undo this change' }))

    const confirmation = await screen.findByRole('dialog', { name: 'Undo this change' })
    await user.click(within(confirmation).getByRole('button', { name: 'Undo the change' }))

    await waitFor(() =>
      expect(requestsTo('POST', '/api/audit-logs/audit-1/revert')).toHaveLength(1),
    )
    // The response carries nothing but a message, so the list is the only place the result
    // of the undo can be read from.
    await waitFor(() => expect(requestsTo('GET', '/api/audit-logs')).toHaveLength(2))
  })

  /**
   * `F-021`. `changes` and `metadata` are open maps the panel walks with `Object.keys` and
   * `Object.entries`, and `toAuditLog` fills in the three revert fields and stops there. An
   * entry served without either key is not a detail-view problem: the row itself counts its
   * changed fields, so one such entry takes down **every row of the table**.
   *
   * `docs/consumer-findings.md` C-08 asks the backend to always serve both, even empty. This
   * is the panel's half of that — an entry type that legitimately has neither, a sign-in or a
   * deletion, is exactly the kind of thing a serializer omits.
   */
  describe('an audit entry the backend served without its open maps', () => {
    /** The wire shape, built here rather than in `db`, because the store is domain-typed. */
    function serveEntry(entry: Record<string, unknown>) {
      server.use(http.get(apiUrl('/audit-logs'), () => ok({ auditLogs: [entry], nextCursor: null })))
    }

    it('renders the table when an entry carries no changes', async () => {
      serveEntry(without(firstLog, 'changes'))

      renderAuditLogs()

      // The row itself, not the badge text: `AuditLogRow` counts `Object.keys(log.changes)`
      // to label the row, so the row existing is the assertion that the count survived.
      expect(await screen.findByRole('row', {
        name: 'Open audit event User Blocked by Admin User',
      })).toBeInTheDocument()
    })

    it('renders the details when an entry carries no metadata', async () => {
      const user = userEvent.setup()
      serveEntry(without(firstLog, 'metadata'))

      renderAuditLogs()

      await user.click(await screen.findByRole('row', {
        name: 'Open audit event User Blocked by Admin User',
      }))

      expect(within(await screen.findByRole('dialog')).getByText('Audit Event Details')).toBeInTheDocument()
    })
  })

  /**
   * `F-022`, measured and **deliberately not fixed**. `AuditEntry.actor` is declared non-null
   * and read without a guard in four places, while `target` — nested identically, in the same
   * type — is nullable and guarded at both of its. That asymmetry is what
   * `docs/consumer-findings.md` C-07 is about.
   *
   * This test records what actually happens rather than asserting what should. The backend has
   * since confirmed the actor columns are five `NOT NULL`s, so this is a **recorded risk, not a
   * live defect** — and the fix, making the domain type nullable, is a TypeScript change that
   * reaches every read site. `docs/TODO.md` carries it under the deferred list.
   */
  it('is measured, not fixed: an entry with no actor takes the whole table down', async () => {
    const withoutActor = without(firstLog, 'actor')
    server.use(http.get(apiUrl('/audit-logs'), () => ok({ auditLogs: [withoutActor], nextCursor: null })))

    renderAuditLogs()

    // Not "renders a dash": the table does not render at all. Pinned as it is, so that the day
    // somebody makes the type nullable, this test tells them what they changed.
    await waitFor(() =>
      expect(screen.queryByRole('row', {
        name: /Open audit event User Blocked/,
      })).not.toBeInTheDocument()
    )
  })

  it('explains a refused undo instead of reporting a generic failure', async () => {
    server.use(
      http.post(apiUrl('/audit-logs/:id/revert'), () =>
        failure(409, 'The value changed after this entry', 'VALUE_CHANGED'),
      ),
    )
    const user = userEvent.setup()
    renderAuditLogs()

    await user.click(await screen.findByRole('row', {
      name: 'Open audit event User Blocked by Admin User',
    }))
    await user.click(await screen.findByRole('button', { name: 'Undo this change' }))
    const confirmation = await screen.findByRole('dialog', { name: 'Undo this change' })
    await user.click(within(confirmation).getByRole('button', { name: 'Undo the change' }))

    expect(await screen.findByText(/would discard that later change/)).toBeInTheDocument()
  })

})
