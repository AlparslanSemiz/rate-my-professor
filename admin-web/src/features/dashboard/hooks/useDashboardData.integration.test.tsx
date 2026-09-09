import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { systemStatusService, type SystemStatus } from '@/api/system'
import { usersService, type User } from '@/api/users'
import { withQueryClient } from '@/test/queryClient'
import { useDashboardData } from './useDashboardData'

/**
 * Named `.integration.` because it runs the hook inside a real `QueryClientProvider` over two
 * services: the units under test are the hook, TanStack Query's client and the derived-state
 * model together. The two `npm run test:*` scripts filter on the filename, so the name is the
 * only thing that decides which suite it belongs to.
 */

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

const newestMember: User = {
  id: 'user-1',
  username: 'Newest Member',
  kitEmail: 'newest@student.kit.edu',
  role: 'STUDENT',
  status: 'ACTIVE',
  joined: '2026-06-01',
  lastOnline: '2026-06-11T18:30:00Z',
  biography: '',
  warnings: 0,
  reports: 0,
  credibilityScore: 100,
}

const status: SystemStatus = {
  status: 'OK',
  checkedAt: '2026-06-11T18:30:00Z',
  startedAt: '2026-06-01T00:00:00Z',
  uptimeSeconds: 900,
  database: { reachable: true, latencyMs: 3, error: null },
  counts: { users: 42, activeUsers: 37, admins: 6, openBugReports: 2 },
  lastWrite: null,
  gitlabEnabled: false,
}

describe('useDashboardData', () => {
  beforeEach(() => {
    vi.mocked(systemStatusService.getStatus).mockResolvedValue(status)
    vi.mocked(usersService.list).mockResolvedValue({ users: [newestMember], nextCursor: null })
  })

  it('takes its totals from the backend counters rather than counting rows itself', async () => {
    const { result } = renderHook(() => useDashboardData(), { wrapper: ({ children }) => withQueryClient(children) })

    await waitFor(() => expect(result.current.stats.total).toBe(42))

    expect(result.current.stats).toEqual({ total: 42, active: 37, admins: 6, openReports: 2 })
    expect(result.current.activeRate).toBe(88)
    expect(result.current.users).toEqual([newestMember])
    // Only the newest few are read; the whole table is never fetched to fill a panel of four.
    expect(usersService.list).toHaveBeenCalledWith({ limit: 4, sort: 'newest' })
    expect(result.current.lastUpdated).toBeInstanceOf(Date)
    expect(result.current.error).toBe('')
    expect(result.current.hasData).toBe(true)
  })

  it('keeps the half that loaded and reports the half that did not', async () => {
    vi.mocked(usersService.list).mockRejectedValue(new Error('Unavailable'))

    const { result } = renderHook(() => useDashboardData(), { wrapper: ({ children }) => withQueryClient(children) })

    await waitFor(() => expect(result.current.stats.total).toBe(42))

    expect(result.current.users).toEqual([])
    expect(result.current.error).toBe('Unavailable')
    expect(result.current.hasData).toBe(true)
    // The timestamp vouches for a complete reading, so a partial one must not move it.
    expect(result.current.lastUpdated).toBeNull()
  })

  /** A degraded database answers the request and carries no counters at all. */
  it('does not read missing counters as zeros', async () => {
    vi.mocked(systemStatusService.getStatus).mockResolvedValue({ ...status, counts: null })

    const { result } = renderHook(() => useDashboardData(), { wrapper: ({ children }) => withQueryClient(children) })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.stats.total).toBe(0)
    expect(result.current.error).toMatch(/counters are unavailable/)
    expect(result.current.lastUpdated).toBeNull()
  })

  it('reports an error without claiming the platform is empty when everything fails', async () => {
    vi.mocked(systemStatusService.getStatus).mockRejectedValue(new Error('Backend unavailable'))
    vi.mocked(usersService.list).mockRejectedValue(new Error('Backend unavailable'))

    const { result } = renderHook(() => useDashboardData(), { wrapper: ({ children }) => withQueryClient(children) })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('Backend unavailable')
    expect(result.current.hasData).toBe(false)
    expect(result.current.lastUpdated).toBeNull()
  })
})
