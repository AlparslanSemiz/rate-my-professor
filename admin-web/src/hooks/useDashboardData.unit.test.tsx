import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { feedbackService } from '../api/FeedbackService'
import { usersService, type User } from '../api/UsersService'
import { useDashboardData } from './useDashboardData'

vi.mock('../api/FeedbackService', () => ({
  feedbackService: {
    getReports: vi.fn(),
  },
}))

vi.mock('../api/UsersService', () => ({
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
    username: 'Inactive User',
    kitEmail: 'inactive@student.kit.edu',
    role: 'STUDENT',
    status: 'INACTIVE',
    joined: '2025-02-10',
    lastOnline: '2026-06-10T18:30:00Z',
    biography: '',
    warnings: 0,
    reports: 0,
  },
]

describe('useDashboardData', () => {
  beforeEach(() => {
    vi.mocked(usersService.getAll).mockResolvedValue(users)
    vi.mocked(feedbackService.getReports).mockResolvedValue([
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
    ])
  })

  it('derives dashboard totals and rates from users and reports', async () => {
    const { result } = renderHook(() => useDashboardData())

    await waitFor(() => expect(result.current.stats.total).toBe(2))

    expect(result.current.stats).toEqual({
      total: 2,
      active: 1,
      admins: 1,
      openReports: 1,
    })
    expect(result.current.activeRate).toBe(50)
    expect(result.current.lastUpdated).toBeInstanceOf(Date)
  })

  it('keeps available data when one overview request fails', async () => {
    vi.mocked(feedbackService.getReports).mockRejectedValue(new Error('Unavailable'))

    const { result } = renderHook(() => useDashboardData())

    await waitFor(() => expect(result.current.stats.total).toBe(2))

    expect(result.current.stats.openReports).toBe(0)
    expect(result.current.lastUpdated).toBeInstanceOf(Date)
  })
})
