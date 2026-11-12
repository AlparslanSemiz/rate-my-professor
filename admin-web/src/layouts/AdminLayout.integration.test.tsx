import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { apiClient } from '@/api/client'
import type { SystemStatus } from '@/api/system'
import type { User } from '@/api/users'
import { EMPTY_AUDIT_META } from '@/domain/auditLog'
import { seedDb } from '@/test/msw/db'
import { failSessionCheck, setSessionUser } from '@/test/msw/handlers/auth'
import { server, startMockBackend } from '@/test/msw/server'
import App from '@/App'

/**
 * The authenticated shell, and the one thing it says on its own behalf.
 *
 * `src/layouts` had no test at all, which is how a session the panel could not confirm came to
 * be reported nowhere (`F-013`). The region is exercised through `App` rather than by rendering
 * `AdminLayout` alone, because what is being checked is that the notice survives the routing,
 * the provider and the protected route — mounting it in isolation would prove none of that.
 */
startMockBackend()

const adminAccount: User = {
  id: 'admin-1',
  username: 'Admin User',
  kitEmail: 'ugoqu@student.kit.edu',
  role: 'ADMIN',
  status: 'ACTIVE',
  joined: '2025-01-10',
  lastOnline: '2026-06-11T18:30:00Z',
  biography: 'Platform administrator.',
  warnings: 0,
  reports: 0,
  credibilityScore: 100,
}

const adminUser = {
  id: adminAccount.id,
  name: adminAccount.username,
  email: adminAccount.kitEmail,
  role: adminAccount.role,
}

const systemStatus: SystemStatus = {
  status: 'OK',
  checkedAt: '2026-06-11T18:30:00Z',
  startedAt: '2026-06-01T00:00:00Z',
  uptimeSeconds: 900,
  database: { reachable: true, latencyMs: 3, error: null },
  counts: { users: 1, activeUsers: 1, admins: 1, openBugReports: 0 },
  lastWrite: null,
  gitlabEnabled: false,
}

function signedIn() {
  localStorage.setItem('token', 'stored-token')
  localStorage.setItem('user', JSON.stringify(adminUser))
  window.history.pushState({}, '', '/dashboard')
}

describe('the shell alert region', () => {
  beforeEach(() => {
    apiClient.setToken(null)
    seedDb({ users: [adminAccount], systemStatus, auditLogs: [], auditMeta: EMPTY_AUDIT_META })
    setSessionUser({
      id: adminAccount.id,
      username: adminAccount.username,
      kitEmail: adminAccount.kitEmail,
      role: adminAccount.role,
    })
  })

  it('says so when the session could not be confirmed, and keeps the operator working', async () => {
    signedIn()
    server.use(failSessionCheck(404, 'No handler for GET /auth/me'))

    render(<App />)

    const notice = await screen.findByRole('status')
    expect(notice).toHaveTextContent(/could not confirm your session/i)
    // Reporting it is not ending it: the dashboard is still there and still usable.
    expect(await screen.findByText("A quick look at how your community's doing today.")).toBeInTheDocument()
  })

  it('announces the notice politely rather than interrupting', async () => {
    signedIn()
    server.use(failSessionCheck(404, 'No handler for GET /auth/me'))

    render(<App />)

    // `role="status"` is polite; `role="alert"` interrupts a screen reader mid-sentence. This
    // notice arrives unprompted during a page load and asks for nothing immediately, so
    // interrupting would be the wrong trade — and Mantine's Alert defaults to `alert`.
    const notice = await screen.findByRole('status')
    expect(notice).toHaveAttribute('role', 'status')
  })

  it('says nothing when the session check succeeds', async () => {
    signedIn()

    render(<App />)

    await screen.findByText("A quick look at how your community's doing today.")
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('gives focus back to the page when the notice is dismissed', async () => {
    // A dismiss button that unmounts itself drops focus to `document.body`, which loses a
    // keyboard user their place entirely. Wave 2 already produced one defect from exactly this
    // area (`F-008`); this is the assertion that stops the second.
    signedIn()
    server.use(failSessionCheck(404, 'No handler for GET /auth/me'))
    const user = userEvent.setup()

    render(<App />)
    await screen.findByRole('status')

    await user.click(screen.getByRole('button', { name: 'Dismiss session notice' }))

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(document.activeElement).not.toBe(document.body)
    expect(document.activeElement).toBe(screen.getByRole('main'))
  })
})
