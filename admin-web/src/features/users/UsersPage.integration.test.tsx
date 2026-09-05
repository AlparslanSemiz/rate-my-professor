import { MantineProvider } from '@mantine/core'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/ApiClient'
import { systemStatusService, type SystemStatus } from '../../api/SystemStatusService'
import { usersService, type User, type UserQuery, type Warning } from '../../api/UsersService'
import { AuthProvider } from '../../context/AuthContext'
import UsersPage from './UsersPage'

vi.mock('../../api/AuthService', () => ({
  authService: {
    me: vi.fn().mockResolvedValue({ success: true, message: 'Signed in' }),
  },
}))

vi.mock('../../api/SystemStatusService', () => ({
  systemStatusService: {
    getStatus: vi.fn(),
  },
}))

vi.mock('../../api/UsersService', () => ({
  usersService: {
    list: vi.fn(),
    getById: vi.fn(),
    getWarnings: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    block: vi.fn(),
    unblock: vi.fn(),
    warn: vi.fn(),
    updateWarning: vi.fn(),
    deleteWarning: vi.fn(),
  },
}))

const status: SystemStatus = {
  status: 'OK',
  checkedAt: '2026-06-11T18:30:00Z',
  startedAt: null,
  uptimeSeconds: null,
  database: { reachable: true, latencyMs: 3, error: null },
  counts: { users: 2, activeUsers: 2, admins: 1 },
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

// The address decides what the operator may do; `u-kisi4@student.kit.edu` is the one allowed to
// act on admin accounts, and it is still reported as a plain ADMIN.
const superAdminUser = { ...authUser, email: 'u-kisi4@student.kit.edu' }

function renderUsers(sessionUser = authUser) {
  localStorage.setItem('token', 'admin-token')
  localStorage.setItem('user', JSON.stringify(sessionUser))

  return render(
    <MantineProvider>
      <AuthProvider>
        <UsersPage />
      </AuthProvider>
    </MantineProvider>
  )
}

describe('Users page', () => {
  // The backend owns the result of every mutation, so the fixtures record what it now holds
  // and `getById` serves a copy of that — a screen may only show what it re-read.
  let accounts: User[]

  function accountById(id: string) {
    const account = accounts.find((candidate) => candidate.id === id)
    if (!account) throw new ApiError(404, 'No such user')
    return account
  }

  beforeEach(() => {
    accounts = users.map((user) => ({ ...user }))
    vi.mocked(systemStatusService.getStatus).mockResolvedValue(status)
    // Stands in for the backend's own filtering, so a test that filters proves the parameters
    // were sent and that the screen shows what came back — not that it narrowed rows itself.
    vi.mocked(usersService.list).mockImplementation(async (query: UserQuery = {}) => ({
      users: accounts
        .filter((user) => !query.status || user.status === query.status)
        .filter((user) => !query.role || user.role === query.role)
        .filter(
          (user) =>
            !query.q ||
            user.username.toLowerCase().includes(query.q.toLowerCase()) ||
            user.kitEmail.toLowerCase().includes(query.q.toLowerCase()),
        )
        .map((user) => ({ ...user })),
      nextCursor: null,
    }))
    vi.mocked(usersService.getById).mockImplementation(async (id) => ({ ...accountById(id) }))
    vi.mocked(usersService.getWarnings).mockResolvedValue([])
    vi.mocked(usersService.delete).mockResolvedValue({ success: true, message: 'Deleted' })
    vi.mocked(usersService.block).mockImplementation(async (id) => {
      accountById(id).status = 'BLOCKED'
      return { success: true, message: 'Blocked' }
    })
    vi.mocked(usersService.unblock).mockImplementation(async (id) => {
      accountById(id).status = 'ACTIVE'
      return { success: true, message: 'Unblocked' }
    })
    vi.mocked(usersService.warn).mockResolvedValue({ success: true, message: 'Warned' })
  })

  it('asks the backend for the page, and for the counters above it', async () => {
    renderUsers()

    expect(await screen.findByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
    // One page, newest first — the ordering the backend switches to as soon as it is given
    // any parameter at all.
    expect(usersService.list).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 50, sort: 'newest' }),
    )
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
    expect(usersService.list).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'bob' }))
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
    expect(usersService.list).toHaveBeenLastCalledWith(expect.objectContaining({ role: 'ADMIN' }))
  })

  it('shows what the backend said was wrong with a refused filter', async () => {
    const user = userEvent.setup()
    renderUsers()

    await screen.findByText('Alice Smith')
    vi.mocked(usersService.list).mockRejectedValueOnce(new ApiError(400, 'Invalid user status'))
    await user.click(screen.getByRole('button', { name: 'Apply filters' }))

    // The backend's own wording, not "Failed to apply the user filters".
    expect(await screen.findByText('Invalid user status')).toBeInTheDocument()
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
  })

  it('loads the next page onto the end of the list', async () => {
    const user = userEvent.setup()
    vi.mocked(usersService.list)
      .mockResolvedValueOnce({ users: [{ ...users[0] }], nextCursor: 'cursor-1' })
      .mockResolvedValueOnce({ users: [{ ...users[1] }], nextCursor: null })
    renderUsers()

    await screen.findByText('Alice Smith')
    await user.click(screen.getByRole('button', { name: 'Load more' }))

    expect(await screen.findByText('Bob Johnson')).toBeInTheDocument()
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    expect(usersService.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ cursor: 'cursor-1' }),
    )
  })

  it('deletes a user from the profile modal after the API confirms removal', async () => {
    const user = userEvent.setup()
    renderUsers()

    await user.click(await screen.findByText('Bob Johnson'))
    expect(await screen.findByText('User Profile')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Delete account' }))
    await user.click(await screen.findByRole('button', { name: 'Delete permanently' }))

    await waitFor(() => expect(usersService.delete).toHaveBeenCalledWith('user-2'))
    expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument()
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
  })

  it('blocks and unblocks a user after each API action succeeds', async () => {
    const user = userEvent.setup()
    renderUsers()

    await user.click(await screen.findByText('Bob Johnson'))
    await user.click(await screen.findByRole('button', { name: 'Block' }))
    await user.click(await screen.findByRole('button', { name: 'Block user' }))

    await waitFor(() => expect(usersService.block).toHaveBeenCalledWith('user-2'))
    expect(await screen.findByRole('button', { name: 'Unblock' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Unblock' }))
    await user.click(await screen.findByRole('button', { name: 'Unblock user' }))

    await waitFor(() => expect(usersService.unblock).toHaveBeenCalledWith('user-2'))
    expect(await screen.findByRole('button', { name: 'Block' })).toBeInTheDocument()
  })

  it('keeps the user and shows an error when deletion fails', async () => {
    vi.mocked(usersService.delete).mockRejectedValue(new Error('Deletion rejected'))
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
    vi.mocked(usersService.getWarnings).mockResolvedValue([
      {
        id: 'warning-1',
        userID: 'user-2',
        message: 'Original wording',
        createdAt: '2026-06-01T10:00:00Z',
        issuedBy: 'admin-1',
        issuedByName: 'Alparslan',
      },
    ])
    vi.mocked(usersService.updateWarning).mockRejectedValue(
      new ApiError(409, 'This warning can no longer be corrected.')
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
    vi.mocked(usersService.getById).mockRejectedValue(new ApiError(500, 'Database unavailable'))
    const user = userEvent.setup()
    renderUsers()

    await user.click(await screen.findByText('Bob Johnson'))

    expect(await screen.findByText('Database unavailable')).toBeInTheDocument()
    expect(screen.queryByText('User not found.')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('still reports a genuinely missing account as missing', async () => {
    vi.mocked(usersService.getById).mockRejectedValue(new ApiError(404, 'No such user'))
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

  it('locks the KIT email always, and the credibility score only for a protected account', async () => {
    const user = userEvent.setup()
    renderUsers()

    await user.click(await screen.findByText('Alice Smith'))
    await user.click(await screen.findByRole('button', { name: 'Edit' }))

    expect(await screen.findByLabelText('KIT email')).toBeDisabled()
    expect(screen.getByLabelText('Credibility score')).toBeDisabled()
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
    vi.mocked(usersService.update).mockResolvedValue({ success: true, message: 'Updated user successfully' })
    vi.mocked(usersService.getById).mockResolvedValueOnce(users[1]).mockResolvedValueOnce({
      ...users[1],
      username: 'Robert Johnson',
    })
    const user = userEvent.setup()
    renderUsers()

    await user.click(await screen.findByText('Bob Johnson'))
    await user.click(await screen.findByRole('button', { name: 'Edit' }))

    const usernameInput = await screen.findByRole('textbox', { name: 'Username' })
    await user.clear(usernameInput)
    await user.type(usernameInput, 'Robert Johnson')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      expect(usersService.update).toHaveBeenCalledWith('user-2', { username: 'Robert Johnson' })
    })
    expect(await screen.findAllByText('Robert Johnson')).not.toHaveLength(0)
  })

  it('names the admin who issued each warning and lets the backend name the issuer', async () => {
    vi.mocked(usersService.getWarnings).mockResolvedValue([
      {
        id: 'warning-1',
        userID: 'user-2',
        message: 'Original wording',
        createdAt: '2026-06-01T10:00:00Z',
        issuedBy: 'admin-1',
        issuedByName: 'Alparslan',
      },
    ])
    const user = userEvent.setup()
    renderUsers()

    await user.click(await screen.findByText('Bob Johnson'))
    expect(await screen.findByText(/Issued by Alparslan/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Warn' }))
    await user.type(screen.getByPlaceholderText('Describe the reason for this warning...'), 'Test warning')
    await user.click(screen.getByRole('button', { name: 'Send warning' }))

    // The issuer travels in the token, so the panel no longer says who it thinks it is.
    await waitFor(() => expect(usersService.warn).toHaveBeenCalledWith('user-2', 'Test warning'))
  })

  it('keeps the warning form open and shows an error when warning fails', async () => {
    vi.mocked(usersService.warn).mockRejectedValue(new Error('Warning rejected'))
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
    accounts[1].warnings = 2
    const history: Warning[] = [
      { id: 'warning-1', userID: 'user-2', message: 'First', createdAt: '2026-06-01T10:00:00Z', issuedBy: 'admin-1', issuedByName: 'Alparslan' },
      { id: 'warning-2', userID: 'user-2', message: 'Second', createdAt: '2026-06-02T10:00:00Z', issuedBy: 'admin-1', issuedByName: 'Alparslan' },
    ]
    vi.mocked(usersService.getWarnings).mockImplementation(async () => [...history])
    vi.mocked(usersService.deleteWarning).mockImplementation(async () => {
      history.pop()
      return { success: true, message: 'Withdrawn' }
    })
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

    await waitFor(() => expect(usersService.deleteWarning).toHaveBeenCalledWith('user-2', 'warning-2'))
    // The count the backend now reports, not the one the page guessed at: withdrawing used to
    // report itself as a new warning and push the row up to 3.
    await waitFor(() => expect(within(row).getByText('1')).toBeInTheDocument())
  })

  it('shows the credibility score and leaves it out of an edit that did not touch it', async () => {
    accounts[1].credibilityScore = 42
    vi.mocked(usersService.update).mockResolvedValue({ success: true, message: 'Updated' })
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
      expect(usersService.update).toHaveBeenCalledWith('user-2', { username: 'Robert Johnson' })
    })
  })
  it('offers no moderation actions on the account the operator is signed in as', async () => {
    const user = userEvent.setup()
    // Same guard, reached by identity rather than by role: this account is a plain student
    // and is protected only because it is the operator's own.
    const self: User = { ...users[1], id: authUser.id, username: 'Admin User' }
    accounts = [self]
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
    expect(usersService.delete).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(usersService.delete).not.toHaveBeenCalled()
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
    vi.mocked(usersService.getById).mockRejectedValueOnce(new ApiError(500, 'Database unavailable'))

    await user.click(await screen.findByRole('button', { name: 'Block' }))
    await user.click(await screen.findByRole('button', { name: 'Block user' }))

    await waitFor(() => expect(usersService.block).toHaveBeenCalledWith('user-2'))

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
      accounts = [self]
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
