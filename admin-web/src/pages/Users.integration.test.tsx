import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteUser, getUsers, type User } from '../api/users'
import Users from './Users'

vi.mock('../api/users', () => ({
  getUsers: vi.fn(),
  deleteUser: vi.fn(),
}))

const users: User[] = [
  {
    id: 1,
    name: 'Alice Smith',
    email: 'alice@example.com',
    role: 'Admin',
    status: 'Active',
    joinedAt: '2025-01-10',
  },
  {
    id: 2,
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'Developer',
    status: 'Active',
    joinedAt: '2025-02-14',
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
    vi.mocked(getUsers).mockResolvedValue(users)
    vi.mocked(deleteUser).mockResolvedValue()
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

  it('deletes a user after the API confirms removal', async () => {
    const user = userEvent.setup()
    renderUsers()

    const aliceCell = await screen.findByText('Alice Smith')
    const aliceRow = aliceCell.closest('tr')
    expect(aliceRow).not.toBeNull()

    await user.click(within(aliceRow as HTMLElement).getByTitle('Delete user'))

    await waitFor(() => expect(deleteUser).toHaveBeenCalledWith(1))
    expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument()
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
  })
})
