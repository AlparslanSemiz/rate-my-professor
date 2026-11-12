import { MantineProvider } from '@mantine/core'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_PAGE_SIZE } from '@/api/client'
import type { SystemStatus } from '@/api/system'
import type { User, Warning } from '@/api/users'
import { AuthProvider } from '@/context/AuthContext'
import { apiUrl } from '@/test/msw/apiUrl'
import { db, seedDb } from '@/test/msw/db'
import { failure } from '@/test/msw/envelope'
import { requestTo, requestsTo } from '@/test/msw/requests'
import { server, startMockBackend } from '@/test/msw/server'
import { withQueryClient } from '@/test/queryClient'
import UsersPage from './UsersPage'

/**
 * The users screen over the real request layer.
 *
 * This file already had a hand-written backend — a mutable `accounts` array, a `list`
 * implementation that applied `q`, `status` and `role`, and `block`/`unblock` that wrote back
 * to it — because a fixed response cannot express "the screen may only show what it re-read".
 * The handlers in `src/test/msw/handlers/users.ts` are that, moved somewhere every test can
 * use it and where the request itself is finally visible.
 *
 * `/auth/me` is deliberately left reporting nobody: a response that names no user is not a
 * correction, so the session these tests put in storage — including its `isSuperAdmin` — is
 * what the page sees.
 */
startMockBackend()

const status: SystemStatus = {
  status: 'OK',
  checkedAt: '2026-06-11T18:30:00Z',
  startedAt: null,
  uptimeSeconds: null,
  database: { reachable: true, latencyMs: 3, error: null },
  counts: { users: 2, activeUsers: 2, admins: 1, openBugReports: null },
  lastWrite: null,
  gitlabEnabled: false,
}

const authUser = {
  id: 'admin-1',
  name: 'Admin User',
  email: 'admin@student.kit.edu',
  role: 'ADMIN',
}

const users: User[] = [
  {
    id: 'user-1',
    username: 'Alice Smith',
    kitEmail: 'alice@student.kit.edu',
    role: 'ADMIN',
    status: 'ACTIVE',
    joined: '2025-01-10',
    lastOnline: '2026-06-11T18:30:00Z',
    biography: 'Platform administrator.',
    warnings: 0,
    reports: 0,
    credibilityScore: 100,
  },
  {
    id: 'user-2',
    username: 'Bob Johnson',
    kitEmail: 'bob@student.kit.edu',
    role: 'STUDENT',
    status: 'ACTIVE',
    joined: '2025-02-14',
    lastOnline: '2026-06-10T22:15:00Z',
    biography: 'Computer Science student.',
    warnings: 0,
    reports: 0,
    credibilityScore: 100,
  },
]

// The backend decides what the operator may do, and reports it as `isSuperAdmin` on
// `/auth/me`. The address is deliberately an ordinary one: nothing about the permission is
// derived from it any more, and the account is still reported as a plain ADMIN.
const superAdminUser = { ...authUser, isSuperAdmin: true }

function renderUsers(sessionUser = authUser) {
  localStorage.setItem('token', 'admin-token')
  localStorage.setItem('user', JSON.stringify(sessionUser))

  return render(
    <MantineProvider>
      <AuthProvider>{withQueryClient(<UsersPage />)}</AuthProvider>
    </MantineProvider>
  )
}

describe('Users page', () => {
  beforeEach(() => {
    seedDb({ users, systemStatus: status })
  })

  it('asks the backend for the page, and for the counters above it', async () => {
    renderUsers()

    expect(await screen.findByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
    // One page, newest first — the ordering the backend switches to as soon as it is given
    // any parameter at all.
    const listed = requestTo('GET', '/api/users').path
    expect(listed).toContain(`limit=${DEFAULT_PAGE_SIZE}`)
    expect(listed).toContain('sort=newest')
    expect(screen.getByText('Total users').previousElementSibling).toHaveTextContent('2')
  })

  it('searches and filters on the backend rather than narrowing the rows on screen', async () => {
    const user = userEvent.setup()
    renderUsers()

    await screen.findByText('Alice Smith')
    await user.type(screen.getByLabelText('Search'), 'bob')
    await user.click(screen.getByRole('button', { name: 'Apply filters' }))

    await waitFor(() => expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument())
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
    expect(requestsTo('GET', '/api/users').at(-1)?.path).toContain('q=bob')
  })

  it('filters by status and role through the same request', async () => {
    const user = userEvent.setup()
    renderUsers()

    await screen.findByText('Alice Smith')
    await user.click(screen.getByLabelText('Filter by role'))
    // Mantine's dropdown never gets a non-zero layout in jsdom, so the option stays
    // `display: none` even though the select is logically open; fireEvent skips the
    // visibility check userEvent would fail on.
    fireEvent.click(await screen.findByRole('option', { name: 'Admin', hidden: true }))
    await user.click(screen.getByRole('button', { name: 'Apply filters' }))

    await waitFor(() => expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument())
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    expect(requestsTo('GET', '/api/users').at(-1)?.path).toContain('role=ADMIN')
  })

  it('shows what the backend said was wrong with a refused filter', async () => {
    const user = userEvent.setup()
    renderUsers()

    await screen.findByText('Alice Smith')
    server.use(http.get(apiUrl('/users'), () => failure(400, 'Invalid user status'), { once: true }))
    await user.click(screen.getByRole('button', { name: 'Apply filters' }))

    // The backend's own wording, not "Failed to apply the user filters".
    expect(await screen.findByText('Invalid user status')).toBeInTheDocument()
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
  })

  it('loads the next page onto the end of the list', async () => {
    // A full page and one more. The handler really slices, so two fixtures would fit on the
    // first page and there would be no second one to append.
    // Dated so the order is not in doubt: the listing is newest-first, so Alice heads the
    // first page, the filler fills it, and Bob is alone on the second.
    const filler = Array.from({ length: DEFAULT_PAGE_SIZE - 1 }, (_, index) => ({
      ...users[0],
      id: `filler-${index}`,
      username: `Filler ${index}`,
      joined: '2024-01-01',
    }))
    seedDb({
      users: [users[0], ...filler, { ...users[1], joined: '2020-01-01' }],
      systemStatus: status,
    })
    const user = userEvent.setup()
    renderUsers()

    await screen.findByText('Alice Smith')
    await user.click(screen.getByRole('button', { name: 'Load more' }))

    expect(await screen.findByText('Bob Johnson')).toBeInTheDocument()
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    // The cursor the first page handed back, sent straight through — an opaque value the
    // panel does not compute, which is the contract in ADR 0006.
    expect(requestsTo('GET', '/api/users').at(-1)?.path).toContain(
      `cursor=${filler.at(-1)?.id}`,
    )
  })

  it('deletes a user from the profile modal after the API confirms removal', async () => {
    const user = userEvent.setup()
    renderUsers()

    await user.click(await screen.findByText('Bob Johnson'))
    expect(await screen.findByText('User Profile')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Delete account' }))
    await user.click(await screen.findByRole('button', { name: 'Delete permanently' }))

    await waitFor(() => expect(requestsTo('DELETE', '/api/users/user-2')).toHaveLength(1))
    await waitFor(() => expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument())
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
  })

  it('blocks and unblocks a user after each API action succeeds', async () => {
    const user = userEvent.setup()
    renderUsers()

    await user.click(await screen.findByText('Bob Johnson'))
    await user.click(await screen.findByRole('button', { name: 'Block' }))
    await user.click(await screen.findByRole('button', { name: 'Block user' }))

    await waitFor(() => expect(requestsTo('PATCH', '/api/users/user-2/block')).toHaveLength(1))
    expect(await screen.findByRole('button', { name: 'Unblock' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Unblock' }))
    await user.click(await screen.findByRole('button', { name: 'Unblock user' }))

    await waitFor(() => expect(requestsTo('PATCH', '/api/users/user-2/unblock')).toHaveLength(1))
    expect(await screen.findByRole('button', { name: 'Block' })).toBeInTheDocument()
  })

  it('keeps the user and shows an error when deletion fails', async () => {
    server.use(http.delete(apiUrl('/users/:id'), () => failure(500, 'Deletion rejected')))
    const user = userEvent.setup()
    renderUsers()

    await user.click(await screen.findByText('Bob Johnson'))
    await user.click(await screen.findByRole('button', { name: 'Delete account' }))
    await user.click(await screen.findByRole('button', { name: 'Delete permanently' }))

    expect(await screen.findByText('Deletion rejected')).toBeInTheDocument()
    expect(screen.getAllByText('Bob Johnson')).not.toHaveLength(0)
    expect(screen.getByRole('button', { name: 'Delete permanently' })).toBeInTheDocument()
  })

  it('reports a refused warning correction and keeps the editor open', async () => {
    db.warnings['user-2'] = [
      {
        id: 'warning-1',
        userID: 'user-2',
        message: 'Original wording',
        createdAt: '2026-06-01T10:00:00Z',
        issuedBy: 'admin-1',
        issuedByName: 'Alparslan',
      },
    ]
    server.use(
      http.patch(apiUrl('/users/:id/warnings/:warningId'), () =>
        failure(409, 'This warning can no longer be corrected.'),
      ),
    )
    const user = userEvent.setup()
    renderUsers()

    await user.click(await screen.findByText('Bob Johnson'))
    await user.click(await screen.findByRole('button', { name: 'Edit warning' }))

    const editor = await screen.findByLabelText('Warning message')
    await user.clear(editor)
    await user.type(editor, 'Corrected wording')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('This warning can no longer be corrected.')).toBeInTheDocument()
    // The typed correction must survive the refusal, not vanish with it.
    expect(screen.getByLabelText('Warning message')).toHaveValue('Corrected wording')
  })

  it('offers a retry when a profile cannot be read, rather than reporting it as missing', async () => {
    server.use(http.get(apiUrl('/users/:id'), () => failure(500, 'Database unavailable')))
    const user = userEvent.setup()
    renderUsers()

    await user.click(await screen.findByText('Bob Johnson'))

    expect(await screen.findByText('Database unavailable')).toBeInTheDocument()
    expect(screen.queryByText('User not found.')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('still reports a genuinely missing account as missing', async () => {
    server.use(http.get(apiUrl('/users/:id'), () => failure(404, 'No such user')))
    const user = userEvent.setup()
    renderUsers()

    await user.click(await screen.findByText('Bob Johnson'))

    expect(await screen.findByText('User not found.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument()
  })

  it('does not offer moderation actions on an admin account', async () => {
    const user = userEvent.setup()
    renderUsers()

    await user.click(await screen.findByText('Alice Smith'))
    expect(await screen.findByText('User Profile')).toBeInTheDocument()

    // Self and other admin accounts cannot be warned, blocked or deleted — the backend
    // answers 409 — but their profile fields stay editable.
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Warn' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Block' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete account' })).not.toBeInTheDocument()
  })

  it('locks the status but not the credibility score of another admin account', async () => {
    const user = userEvent.setup()
    renderUsers()

    await user.click(await screen.findByText('Alice Smith'))
    await user.click(await screen.findByRole('button', { name: 'Edit' }))

    // The backend reserves an admin account's status for an elevated operator, but takes a
    // credibility score from any admin — locking both hid an edit it would have accepted.
    expect(await screen.findByLabelText('KIT email')).toBeDisabled()
    const dialog = within(screen.getByRole('dialog'))
    expect(dialog.getByLabelText('Status')).toBeDisabled()
    expect(dialog.getByLabelText('Credibility score')).toBeEnabled()
  })

  it('leaves the credibility score editable for a non-protected account', async () => {
    const user = userEvent.setup()
    renderUsers()

    await user.click(await screen.findByText('Bob Johnson'))
    await user.click(await screen.findByRole('button', { name: 'Edit' }))

    expect(await screen.findByLabelText('KIT email')).toBeDisabled()
    expect(screen.getByLabelText('Credibility score')).not.toBeDisabled()
  })

  it('sends only the fields an edit changed and shows the re-read account', async () => {
    // No staged responses: the handler applies the edit, so the re-read returns the new name
    // because the write happened — which is what "may only show what it re-read" means.
    const user = userEvent.setup()
    renderUsers()

    await user.click(await screen.findByText('Bob Johnson'))
    await user.click(await screen.findByRole('button', { name: 'Edit' }))

    const usernameInput = await screen.findByRole('textbox', { name: 'Username' })
    await user.clear(usernameInput)
    await user.type(usernameInput, 'Robert Johnson')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      expect(requestTo('PATCH', '/api/users/user-2').body).toEqual({
        username: 'Robert Johnson',
      })
    })
    expect(await screen.findAllByText('Robert Johnson')).not.toHaveLength(0)
  })

  it('names the admin who issued each warning and lets the backend name the issuer', async () => {
    db.warnings['user-2'] = [
      {
        id: 'warning-1',
        userID: 'user-2',
        message: 'Original wording',
        createdAt: '2026-06-01T10:00:00Z',
        issuedBy: 'admin-1',
        issuedByName: 'Alparslan',
      },
    ]
    const user = userEvent.setup()
    renderUsers()

    await user.click(await screen.findByText('Bob Johnson'))
    expect(await screen.findByText(/Issued by Alparslan/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Warn' }))
    await user.type(screen.getByPlaceholderText('Describe the reason for this warning...'), 'Test warning')
    await user.click(screen.getByRole('button', { name: 'Send warning' }))

    // The issuer travels in the token, so the panel no longer says who it thinks it is.
    await waitFor(() =>
      expect(requestTo('POST', '/api/users/user-2/warnings').body).toEqual({
        message: 'Test warning',
      }),
    )
  })

  it('keeps the warning form open and shows an error when warning fails', async () => {
    server.use(http.post(apiUrl('/users/:id/warnings'), () => failure(500, 'Warning rejected')))
    const user = userEvent.setup()
    renderUsers()

    await user.click(await screen.findByText('Bob Johnson'))
    await user.click(await screen.findByRole('button', { name: 'Warn' }))
    await user.type(screen.getByPlaceholderText('Describe the reason for this warning...'), 'Test warning')
    await user.click(screen.getByRole('button', { name: 'Send warning' }))

    expect(await screen.findByText('Warning rejected')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Describe the reason for this warning...')).toHaveValue('Test warning')
  })

  it('lowers the table count when a warning is withdrawn', async () => {
    db.users[1].warnings = 2
    const history: Warning[] = [
      { id: 'warning-1', userID: 'user-2', message: 'First', createdAt: '2026-06-01T10:00:00Z', issuedBy: 'admin-1', issuedByName: 'Alparslan' },
      { id: 'warning-2', userID: 'user-2', message: 'Second', createdAt: '2026-06-02T10:00:00Z', issuedBy: 'admin-1', issuedByName: 'Alparslan' },
    ]
    db.warnings['user-2'] = history
    const user = userEvent.setup()
    renderUsers()

    const row = (await screen.findByText('Bob Johnson')).closest('tr') as HTMLElement
    expect(within(row).getByText('2')).toBeInTheDocument()

    await user.click(screen.getByText('Bob Johnson'))
    const withdrawControls = await screen.findAllByRole('button', { name: 'Withdraw warning' })
    await user.click(withdrawControls[1])

    // The row control and the confirmation share a name, so the click has to go to the dialog.
    const confirmation = await screen.findByRole('dialog', { name: 'Withdraw warning' })
    await user.click(within(confirmation).getByRole('button', { name: 'Withdraw warning' }))

    await waitFor(() =>
      expect(requestsTo('DELETE', '/api/users/user-2/warnings/warning-2')).toHaveLength(1),
    )
    // The count the backend now reports, not the one the page guessed at: withdrawing used to
    // report itself as a new warning and push the row up to 3.
    await waitFor(() => expect(within(row).getByText('1')).toBeInTheDocument())
  })

  it('shows the credibility score and leaves it out of an edit that did not touch it', async () => {
    db.users[1].credibilityScore = 42
    const user = userEvent.setup()
    renderUsers()

    await user.click(await screen.findByText('Bob Johnson'))
    expect(await screen.findByText('Credibility')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    expect(await screen.findByLabelText('Credibility score')).toHaveValue('42')

    const usernameInput = screen.getByRole('textbox', { name: 'Username' })
    await user.clear(usernameInput)
    await user.type(usernameInput, 'Robert Johnson')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    // Re-sending the stored score would write an audit event whose before and after match.
    await waitFor(() => {
      expect(requestTo('PATCH', '/api/users/user-2').body).toEqual({
        username: 'Robert Johnson',
      })
    })
  })
  it('offers no moderation actions on the account the operator is signed in as', async () => {
    const user = userEvent.setup()
    // Same guard, reached by identity rather than by role: this account is a plain student
    // and is protected only because it is the operator's own.
    const self: User = { ...users[1], id: authUser.id, username: 'Admin User' }
    seedDb({ users: [self], systemStatus: status })
    renderUsers()

    await user.click(await screen.findByText('Admin User'))
    expect(await screen.findByText('User Profile')).toBeInTheDocument()

    const dialog = within(screen.getByRole('dialog'))
    expect(dialog.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    expect(dialog.queryByRole('button', { name: 'Block' })).not.toBeInTheDocument()
    expect(dialog.queryByRole('button', { name: 'Delete account' })).not.toBeInTheDocument()
  })

  it('deletes nothing when the confirmation is dismissed', async () => {
    const user = userEvent.setup()
    renderUsers()

    await user.click(await screen.findByText('Bob Johnson'))
    await user.click(await screen.findByRole('button', { name: 'Delete account' }))

    expect(await screen.findByText(/Permanently delete Bob Johnson/)).toBeInTheDocument()
    expect(requestsTo('DELETE', '/api/users/user-2')).toHaveLength(0)

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(requestsTo('DELETE', '/api/users/user-2')).toHaveLength(0)
    expect(screen.queryByText(/Permanently delete Bob Johnson/)).not.toBeInTheDocument()
    // Still listed, and the profile is still open behind the dismissed confirmation.
    expect(screen.getAllByText('Bob Johnson').length).toBeGreaterThan(0)
  })

  it('reports a block the backend accepted as done, even when the re-read fails', async () => {
    const user = userEvent.setup()
    renderUsers()

    await user.click(await screen.findByText('Bob Johnson'))
    await screen.findByText('User Profile')
    // The block lands; only the read that follows it does not.
    server.use(http.get(apiUrl('/users/:id'), () => failure(500, 'Database unavailable'), { once: true }))

    await user.click(await screen.findByRole('button', { name: 'Block' }))
    await user.click(await screen.findByRole('button', { name: 'Block user' }))

    await waitFor(() => expect(requestsTo('PATCH', '/api/users/user-2/block')).toHaveLength(1))

    // The confirmation closes: telling the operator nothing was saved would be untrue. What
    // is reported instead is that the profile shown is the last one that could be read.
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Block user' })).not.toBeInTheDocument()
    )
    expect(await screen.findByText(/reading it back failed/)).toHaveTextContent('Database unavailable')
    expect(screen.getByRole('button', { name: 'Block' })).toBeInTheDocument()
  })

  describe('signed in as an operator who may act on admins', () => {
    it('offers the moderation actions on another admin account', async () => {
      const user = userEvent.setup()
      // The permission rides on the flag alone: this operator's address is on no list.
      renderUsers(superAdminUser)

      await user.click(await screen.findByText('Alice Smith'))
      expect(await screen.findByText('User Profile')).toBeInTheDocument()

      const dialog = within(screen.getByRole('dialog'))
      expect(dialog.getByRole('button', { name: 'Warn' })).toBeInTheDocument()
      expect(dialog.getByRole('button', { name: 'Block' })).toBeInTheDocument()
      expect(dialog.getByRole('button', { name: 'Delete account' })).toBeInTheDocument()
    })

    it('unlocks the status and credibility score of another admin account', async () => {
      const user = userEvent.setup()
      renderUsers(superAdminUser)

      await user.click(await screen.findByText('Alice Smith'))
      await user.click(await screen.findByRole('button', { name: 'Edit' }))

      // Scoped to the profile: the filter bar above it has its own Status and Role selects.
      const dialog = within(screen.getByRole('dialog'))
      expect(await dialog.findByLabelText('Credibility score')).toBeEnabled()
      expect(dialog.getByLabelText('Status')).toBeEnabled()
      // The login identity is not editable for anyone.
      expect(dialog.getByLabelText('KIT email')).toBeDisabled()
    })

    it('still protects the operator\u2019s own account', async () => {
      const user = userEvent.setup()
      const self: User = { ...users[0], id: authUser.id, username: 'Admin User' }
      seedDb({ users: [self], systemStatus: status })
      renderUsers(superAdminUser)

      await user.click(await screen.findByText('Admin User'))
      expect(await screen.findByText('User Profile')).toBeInTheDocument()

      const dialog = within(screen.getByRole('dialog'))
      expect(dialog.queryByRole('button', { name: 'Warn' })).not.toBeInTheDocument()
      expect(dialog.queryByRole('button', { name: 'Block' })).not.toBeInTheDocument()
      expect(dialog.queryByRole('button', { name: 'Delete account' })).not.toBeInTheDocument()

      await user.click(dialog.getByRole('button', { name: 'Edit' }))
      expect(await dialog.findByLabelText('Role')).toBeDisabled()
      expect(dialog.getByLabelText('Credibility score')).toBeDisabled()
    })
  })
})
