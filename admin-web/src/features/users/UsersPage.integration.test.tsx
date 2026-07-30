import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usersService, type User } from '../../api/UsersService'
import { AuthProvider } from '../../context/AuthContext'
import UsersPage from './UsersPage'

vi.mock('../../api/UsersService', () => ({
  usersService: {
    getAll: vi.fn(),
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
  },
]

function renderUsers() {
  localStorage.setItem('token', 'admin-token')
  localStorage.setItem('user', JSON.stringify(authUser))

  return render(
    <MantineProvider>
      <AuthProvider>
        <UsersPage />
      </AuthProvider>
    </MantineProvider>
  )
}

describe('Users page', () => {
  beforeEach(() => {
    vi.mocked(usersService.getAll).mockResolvedValue(users)
    vi.mocked(usersService.getById).mockImplementation(async (id) => {
      const user = users.find((candidate) => candidate.id === id)
      if (!user) throw new Error('User not found')
      return user
    })
    vi.mocked(usersService.getWarnings).mockResolvedValue([])
    vi.mocked(usersService.delete).mockResolvedValue({ success: true, message: 'Deleted' })
    vi.mocked(usersService.block).mockResolvedValue({ success: true, message: 'Blocked' })
    vi.mocked(usersService.unblock).mockResolvedValue({ success: true, message: 'Unblocked' })
    vi.mocked(usersService.warn).mockResolvedValue({ success: true, message: 'Warned' })
  })

  it('loads users and filters by name or email', async () => {
    const user = userEvent.setup()
    renderUsers()

    expect(await screen.findByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText('Search by name or email...'), 'bob')

    expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument()
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
    expect(screen.getByText('bob@student.kit.edu')).toBeInTheDocument()
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
})
