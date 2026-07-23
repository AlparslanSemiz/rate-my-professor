import { useEffect, useState } from 'react'
import { feedbackService } from '../api/FeedbackService'
import { usersService, type User } from '../api/UsersService'

export interface DashboardStats {
  total: number
  active: number
  admins: number
  openReports: number
}

const REFRESH_INTERVAL_MS = 15_000

function countOpenReports(reports: { status: string }[]) {
  return reports.filter((report) => report.status === 'OPEN').length
}

function calculateDashboardStats(users: User[], openReports: number): DashboardStats {
  return {
    total: users.length,
    active: users.filter((user) => user.status === 'ACTIVE').length,
    admins: users.filter((user) => user.role === 'ADMIN').length,
    openReports,
  }
}

function calculateActiveRate({ total, active }: DashboardStats) {
  return total ? Math.round((active / total) * 100) : 0
}

export function useDashboardData() {
  const [users, setUsers] = useState<User[]>([])
  const [openReports, setOpenReports] = useState(0)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    let cancelled = false

    function refresh() {
      // The dashboard is an overview; if a request fails we keep the previous
      // values rather than blocking the whole page.
      Promise.all([
        usersService.getAll().catch(() => null),
        feedbackService.getReports().catch(() => null),
      ]).then(([fetchedUsers, reports]) => {
        if (cancelled) return
        if (fetchedUsers) setUsers(fetchedUsers)
        if (reports) setOpenReports(countOpenReports(reports))
        setLastUpdated(new Date())
      })
    }

    refresh()
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const stats = calculateDashboardStats(users, openReports)
  return {
    users,
    stats,
    activeRate: calculateActiveRate(stats),
    lastUpdated,
  }
}
