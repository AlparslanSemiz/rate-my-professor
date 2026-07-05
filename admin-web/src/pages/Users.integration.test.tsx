import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usersService, type User } from '../api/UsersService'
import Users from './Users'

vi.mock('../api/UsersService', () => ({
  usersService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    getWarnings: vi.fn(),
    delete: vi.fn(),
    block: vi.fn(),
    unblock: vi.fn(),
    warn: vi.fn(),
  },
}))

const users: User[] = [
  {
    id: 1,
    name: 'Alice Smith',
    email: 'alice@example.com',
    role: 'Admin',
    status: 'Active',
    joinedAt: '2025-01-10',
    lastSeenAt: '2026-06-11T18:30:00Z',
    warningCount: 0,
    bio: 'Platform administrator.',
    reportCount: 0,
  },
  {
    id: 2,
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'Professor',
    status: 'Active',
    joinedAt: '2025-02-14',
    lastSeenAt: '2026-06-10T22:15:00Z',
    warningCount: 0,
    bio: 'Professor of Computer Science.',
    reportCount: 0,
  },
]

function renderUsers() {
  return render(
    <MantineProvider>
      <Users />
    </MantineProvider>
  )
}

describe('Users page', () => {
  beforeEach(() => {
    vi.mocked(usersService.getAll).mockResolvedValue(users)
    vi.mocked(usersService.getById).mockImplementation(async (id) =>
      users.find((user) => user.id === id)
    )
    vi.mocked(usersService.getWarnings).mockResolvedValue([])
    vi.mocked(usersService.delete).mockResolvedValue()
    vi.mocked(usersService.block).mockResolvedValue()
    vi.mocked(usersService.unblock).mockResolvedValue()
    vi.mocked(usersService.warn).mockResolvedValue({
      id: 1,
      message: 'Warning',
      issuedAt: '2026-06-12T10:00:00Z',
      issuedBy: 'Admin User',
    })
  })

  it('loads users and filters by name or email', async () => {
    const user = userEvent.setup()
    renderUsers()

    expect(await screen.findByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText('Search by name or email...'), 'bob')

    expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument()
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
    expect(screen.getByText('bob@example.com')).toBeInTheDocument()
  })

  it('deletes a user from the profile modal after the API confirms removal', async () => {
    const user = userEvent.setup()
    renderUsers()

    await user.click(await screen.findByText('Alice Smith'))
    expect(await screen.findByText('User Profile')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Delete account' }))
    await user.click(await screen.findByRole('button', { name: 'Delete permanently' }))

    await waitFor(() => expect(usersService.delete).toHaveBeenCalledWith(1))
    expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument()
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
  })
})
