import { MantineProvider } from '@mantine/core'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { systemStatusService, type SystemStatus } from '@/api/system'
import { usersService, type User } from '@/api/users'
import { AuthProvider } from '@/context/AuthContext'
import type { QueryClient } from '@tanstack/react-query'
import { createTestQueryClient, withQueryClient } from '@/test/queryClient'
import DashboardPage from './DashboardPage'

vi.mock('@/api/auth', () => ({
  authService: {
    me: vi.fn().mockResolvedValue({ success: true, message: 'OK' }),
    logout: vi.fn().mockResolvedValue({ success: true, message: 'Logged out' }),
  },
}))

vi.mock('@/api/system', () => ({
  systemStatusService: {
    getStatus: vi.fn(),
  },
}))

vi.mock('@/api/users', () => ({
  usersService: {
    list: vi.fn(),
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
    credibilityScore: 100,
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
    credibilityScore: 100,
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
    credibilityScore: 100,
  },
]

const status: SystemStatus = {
  status: 'OK',
  checkedAt: '2026-06-11T18:30:00Z',
  startedAt: '2026-06-01T00:00:00Z',
  uptimeSeconds: 900,
  database: { reachable: true, latencyMs: 3, error: null },
  counts: { users: 3, activeUsers: 2, admins: 1, openBugReports: 1 },
  lastWrite: null,
  gitlabEnabled: false,
}

/**
 * Drives one refresh.
 *
 * The screen polls every fifteen seconds, but the behaviour these tests guard is what a
 * *failed refresh* does, not when the next one is due — and the interval itself is TanStack's
 * to get right. Asking the client to re-read says the same thing without a clock: fake timers
 * also stand in for `queueMicrotask`, which is how the query client notifies its observers,
 * and the two do not compose.
 */
async function refreshDashboard(client: QueryClient) {
  await act(async () => {
    await client.refetchQueries()
  })
}

function renderDashboard(client = createTestQueryClient()) {
  render(
    <MantineProvider>
      <AuthProvider>
        {withQueryClient(
          <MemoryRouter>
            <DashboardPage />
          </MemoryRouter>,
          client
        )}
      </AuthProvider>
    </MantineProvider>
  )
  return client
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
    vi.mocked(systemStatusService.getStatus).mockResolvedValue(status)
    vi.mocked(usersService.list).mockResolvedValue({ users, nextCursor: null })
  })

  it('shows the backend counters once both reads answer', async () => {
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

  it('shows each number once, and keeps the reading time', async () => {
    renderDashboard()
    await screen.findByText('Total users')

    // `F-066`. The dashboard rendered four facts eight times and overflowed the viewport by
    // 223px doing it. The two progress bars were a third rendering of the active share and a
    // second of the admin count, and "Jump to" repeated three sidebar destinations that are on
    // screen the whole time. Both blocks are gone; the cards keep every number they carried.
    expect(screen.queryAllByRole('progressbar')).toHaveLength(0)
    expect(screen.queryByText('Admin share of accounts')).not.toBeInTheDocument()
    expect(screen.queryByText('Jump to')).not.toBeInTheDocument()
    expect(screen.queryByText('How things are running')).not.toBeInTheDocument()

    // The one value that lived nowhere else. It stays in the hero, labelled `Updated`, rather
    // than going with the blocks that were removed.
    expect(screen.getByText('Updated')).toBeInTheDocument()

    // What must survive: every counter the removed blocks were derived from.
    expect(statValue('Admin accounts')).toBe('1')
    expect(screen.getAllByText('Active accounts').length).toBeGreaterThan(0)
  })

  it('gives its title the same shape as every other screen', async () => {
    renderDashboard()
    await screen.findByText('Total users')

    // `F-064` and `F-071`. Seven routes render `PageHeader`, which is the only component that
    // emits an `h1` and the only one that draws the accent bar; a cross-route sweep found the
    // title at x=288, y=32 on all seven and nothing at all here. So the panel's landing screen
    // was the one screen whose title was not a title, and the one with no top-level heading for
    // a screen reader to navigate by.
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent(/Welcome back,/)

    // The bar is decorative, so it is `aria-hidden` and has to be found in the DOM rather than
    // through a role. Asserted because it is half of what makes the header read as a header.
    expect(heading.closest('header')?.querySelector('[aria-hidden]')).not.toBeNull()
  })

  it('reports a failed first load instead of claiming the platform is empty', async () => {
    vi.mocked(systemStatusService.getStatus).mockRejectedValue(new Error('Counters are unavailable.'))
    vi.mocked(usersService.list).mockRejectedValue(new Error('Counters are unavailable.'))
    renderDashboard()

    expect(await screen.findByRole('alert')).toHaveTextContent('Counters are unavailable.')
    // Zeros would be a claim about the platform rather than about the failed read.
    expect(screen.queryByText('Total users')).not.toBeInTheDocument()
  })

  it('loads the counts when the failed first load is retried', async () => {
    const user = userEvent.setup()
    vi.mocked(systemStatusService.getStatus).mockRejectedValueOnce(new Error('Counters are unavailable.'))
    vi.mocked(usersService.list).mockRejectedValueOnce(new Error('Counters are unavailable.'))
    renderDashboard()

    await user.click(await screen.findByRole('button', { name: 'Try again' }))

    expect(await screen.findByText('Total users')).toBeInTheDocument()
    expect(statValue('Total users')).toBe('3')
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument()
  })

  it('keeps the last good counts and marks the reading stale when a refresh fails', async () => {
    const client = renderDashboard()
    expect(await screen.findByText('Total users')).toBeInTheDocument()
    expect(statValue('Total users')).toBe('3')

    vi.mocked(systemStatusService.getStatus).mockRejectedValue(new Error('Counters are unavailable.'))
    await refreshDashboard(client)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Counters are unavailable. Showing the last successful reading.'
    )
    // The point of the whole arrangement: a dashboard quietly showing zeros would claim
    // nobody has signed up.
    expect(statValue('Total users')).toBe('3')
  })

  it('drops the stale banner once a refresh succeeds again', async () => {
    vi.mocked(systemStatusService.getStatus).mockRejectedValueOnce(new Error('Counters are unavailable.'))
    const client = renderDashboard()
    expect(await screen.findByRole('alert')).toHaveTextContent('Showing the last successful reading.')

    await refreshDashboard(client)

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
    expect(statValue('Total users')).toBe('3')
  })
})
