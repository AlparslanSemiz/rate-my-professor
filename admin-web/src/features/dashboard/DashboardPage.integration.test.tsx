import { MantineProvider } from '@mantine/core'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { feedbackService, type BugReport } from '../../api/FeedbackService'
import { usersService, type User } from '../../api/UsersService'
import { AuthProvider } from '../../context/AuthContext'
import DashboardPage from './DashboardPage'

vi.mock('../../api/AuthService', () => ({
  authService: {
    me: vi.fn().mockResolvedValue({ success: true, message: 'OK' }),
    logout: vi.fn().mockResolvedValue({ success: true, message: 'Logged out' }),
  },
}))

vi.mock('../../api/FeedbackService', () => ({
  feedbackService: {
    getReports: vi.fn(),
  },
}))

vi.mock('../../api/UsersService', () => ({
  usersService: {
    getAll: vi.fn(),
  },
}))

const users: User[] = [
  {
    id: 'admin-1',
    username: 'Admin User',
    kitEmail: 'admin@student.kit.edu',
    role: 'ADMIN',
    status: 'ACTIVE',
    joined: '2025-01-10',
    lastOnline: '2026-06-11T18:30:00Z',
    biography: '',
    warnings: 0,
    reports: 0,
  },
  {
    id: 'user-1',
    username: 'Active Student',
    kitEmail: 'active@student.kit.edu',
    role: 'STUDENT',
    status: 'ACTIVE',
    joined: '2025-02-10',
    lastOnline: '2026-06-10T18:30:00Z',
    biography: '',
    warnings: 0,
    reports: 0,
  },
  {
    id: 'user-2',
    username: 'Blocked Student',
    kitEmail: 'blocked@student.kit.edu',
    role: 'STUDENT',
    status: 'BLOCKED',
    joined: '2025-03-10',
    lastOnline: '2026-06-09T18:30:00Z',
    biography: '',
    warnings: 3,
    reports: 1,
  },
]

const reports: BugReport[] = [
  {
    id: 'report-1',
    title: 'Open report',
    description: '',
    severity: 'HIGH',
    status: 'OPEN',
    reporterName: 'Reporter',
    reportedAt: '2026-06-11T18:30:00Z',
  },
  {
    id: 'report-2',
    title: 'Reviewed report',
    description: '',
    severity: 'LOW',
    status: 'REVIEWED',
    reporterName: 'Reporter',
    reportedAt: '2026-06-10T18:30:00Z',
  },
]

function renderDashboard() {
  return render(
    <MantineProvider>
      <AuthProvider>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </AuthProvider>
    </MantineProvider>
  )
}

/**
 * The value sits next to its label inside the stat card, so the two are read together.
 * "Active accounts" is deliberately not looked up this way: System Pulse uses the same label
 * for the percentage, so the count is asserted through the "Total users" card's sub-line.
 */
function statValue(label: string) {
  return screen.getByText(label).nextElementSibling?.textContent
}

describe('Dashboard page', () => {
  beforeEach(() => {
    vi.mocked(usersService.getAll).mockResolvedValue(users)
    vi.mocked(feedbackService.getReports).mockResolvedValue(reports)
  })

  it('shows the counts once both reads answer', async () => {
    renderDashboard()

    expect(await screen.findByText('Total users')).toBeInTheDocument()
    expect(statValue('Total users')).toBe('3')
    expect(screen.getByText('2 active')).toBeInTheDocument()
    expect(statValue('Admin accounts')).toBe('1')
    expect(statValue('Open reports')).toBe('1')
  })

  it('calls the active share the same thing everywhere it appears', async () => {
    renderDashboard()
    await screen.findByText('Total users')

    // The hero, the stat card and System Pulse all describe `active / total`, so none of
    // them may give it a different name.
    expect(screen.queryByText('Accounts not blocked')).not.toBeInTheDocument()
    const shares = screen
      .getAllByText('Active accounts')
      .map((label) => label.nextElementSibling?.textContent)
    expect(shares).toContain('67%')
  })

  it('reports a failed first load instead of claiming the platform is empty', async () => {
    vi.mocked(usersService.getAll).mockRejectedValue(new Error('Users are unavailable.'))
    vi.mocked(feedbackService.getReports).mockRejectedValue(new Error('Users are unavailable.'))
    renderDashboard()

    expect(await screen.findByRole('alert')).toHaveTextContent('Users are unavailable.')
    // Zeros would be a claim about the platform rather than about the failed read.
    expect(screen.queryByText('Total users')).not.toBeInTheDocument()
  })

  it('loads the counts when the failed first load is retried', async () => {
    const user = userEvent.setup()
    vi.mocked(usersService.getAll).mockRejectedValueOnce(new Error('Users are unavailable.'))
    vi.mocked(feedbackService.getReports).mockRejectedValueOnce(new Error('Users are unavailable.'))
    renderDashboard()

    await user.click(await screen.findByRole('button', { name: 'Try again' }))

    expect(await screen.findByText('Total users')).toBeInTheDocument()
    expect(statValue('Total users')).toBe('3')
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument()
  })

  it('keeps the last good counts and marks the reading stale when a refresh fails', async () => {
    vi.useFakeTimers()
    renderDashboard()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(statValue('Total users')).toBe('3')

    vi.mocked(usersService.getAll).mockRejectedValue(new Error('Users are unavailable.'))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000)
    })

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Users are unavailable. Showing the last successful reading.'
    )
    expect(statValue('Total users')).toBe('3')
  })

  it('drops the stale banner once a refresh succeeds again', async () => {
    vi.useFakeTimers()
    vi.mocked(usersService.getAll).mockRejectedValueOnce(new Error('Users are unavailable.'))
    renderDashboard()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(screen.getByRole('alert')).toHaveTextContent('Showing the last successful reading.')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000)
    })

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(statValue('Total users')).toBe('3')
  })
})
