import { http } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { authService } from '@/api/auth'
import { apiClient } from '@/api/client'
import { feedbackService } from '@/api/feedback'
import { auditLogsService } from '@/api/logs'
import { usersService } from '@/api/users'
import { apiUrl } from '@/test/msw/apiUrl'
import { seedDb } from '@/test/msw/db'
import { failure } from '@/test/msw/envelope'
import { requestTo } from '@/test/msw/requests'
import { server, startMockBackend } from '@/test/msw/server'
import type { BugReport } from '@/api/feedback'
import type { User } from '@/api/users'
import type { AuditLog } from '@/domain/auditLog'

/**
 * The five writes that carry no body, and therefore no `Content-Type`.
 *
 * `ApiRequestBuilder` sets the header only when `init.body !== undefined`, and
 * `JSON.stringify(undefined)` is `undefined` — so these five go out with the header absent
 * rather than empty. `docs/consumer-findings.md` C-03 asked the backend to confirm it accepts
 * that; until now the answer lived in a paragraph, where nothing could contradict it.
 *
 * Exercised at the service layer rather than through the screens, because the header is a
 * property of the request the client builds and not of any one page — and because the GitLab
 * escalation's own page still replaces its service module, so no screen test can produce it.
 */
startMockBackend()

const user: User = {
  id: 'user-1',
  username: 'Mira Kowalski',
  kitEmail: 'umira@student.kit.edu',
  role: 'STUDENT',
  status: 'ACTIVE',
  joined: '2025-01-10',
  lastOnline: '2026-06-11T18:30:00Z',
  biography: '',
  warnings: 0,
  reports: 0,
  credibilityScore: 100,
}

const auditLog: AuditLog = {
  id: 'audit-1',
  action: 'USER_UPDATED',
  createdAt: '2026-06-11T18:30:00Z',
  actor: { type: 'ADMIN', id: 'admin-1', name: 'Admin User', email: 'a@student.kit.edu', role: 'ADMIN' },
  target: { type: 'USER', id: user.id, label: user.username },
  changes: { credibilityScore: { before: 80, after: 72 } },
  metadata: {},
  revertible: true,
  revertBlockedReason: null,
  revertedByAuditId: null,
}

const bugReport: BugReport = {
  id: 'report-1',
  title: 'Ratings do not load',
  description: 'The ratings tab stays empty.',
  status: 'OPEN',
  severity: 'MEDIUM',
  reportedAt: '2026-06-11T18:30:00Z',
  reporterName: 'Mira Kowalski',
  issueUrl: null,
  issueState: 'NONE',
}

/**
 * The base the client prefixes every path with, which is what lands in the recorded URL.
 * Derived rather than written out, so the assertions cannot drift from `.env`.
 */
const BASE = new URL(apiUrl('/'), 'http://localhost').pathname.replace(/\/$/, '')

/** The five, named once so the two suites below cannot drift apart. */
const BODYLESS_WRITES = [
  { method: 'POST', path: '/auth/logout', send: () => authService.logout() },
  { method: 'POST', path: '/audit-logs/audit-1/revert', send: () => auditLogsService.revert('audit-1') },
  { method: 'POST', path: '/reports/report-1/gitlab-issue', send: () => feedbackService.createGitlabIssue('report-1') },
  { method: 'PATCH', path: '/users/user-1/block', send: () => usersService.block('user-1') },
  { method: 'PATCH', path: '/users/user-1/unblock', send: () => usersService.unblock('user-1') },
] as const

describe('the writes that carry no body', () => {
  beforeEach(() => {
    apiClient.setToken('admin-token')
    seedDb({ users: [user], auditLogs: [auditLog], bugReports: [bugReport], gitlabEnabled: true })
  })

  it.each(BODYLESS_WRITES)('sends $method $path with no Content-Type', async ({ method, path, send }) => {
    await send()

    // Absent, not empty. A backend that rejects an absent `Content-Type` on a POST or PATCH
    // would fail all five of these, and `POST /auth/logout` would fail silently.
    //
    // The header claim is no longer only these five: `src/api/callSurface.integration.test.ts`
    // carries a `Content-Type` expectation for **every** call the panel can make, so a write
    // that started sending one, or a read that stopped, is caught there too. These five stay
    // because the file's other half — what a `415` on each of them does — has no equivalent
    // in a sweep that only looks at requests.
    expect(requestTo(method, `${BASE}${path}`).contentType).toBeNull()
  })

  it.each(BODYLESS_WRITES)('reports a 415 from $method $path instead of crashing', async ({ method, path, send }) => {
    const handler = method === 'POST' ? http.post : http.patch
    server.use(handler(apiUrl(path), () => failure(415, 'Content-Type is required')))

    // The panel has no branch for 415 — `apiErrors`' table has no row for it, so it arrives as
    // a plain `ResponseError`. What matters is that it arrives at all, carrying the backend's
    // own sentence, rather than surfacing as a `TypeError` from an unparsed body.
    await expect(send()).rejects.toThrow('Content-Type is required')
  })
})

describe('a 415 on sign-out', () => {
  beforeEach(() => {
    apiClient.setToken('admin-token')
    seedDb({ users: [user] })
  })

  it('is swallowed, so the operator believes they signed out while the token stays live', async () => {
    // Pinned, not fixed. `AuthContext.logout` catches everything on purpose — signing out
    // locally is safer than staying signed in when the backend cannot be reached. The cost is
    // that a refusal is indistinguishable from an outage: the panel forgets the token and the
    // backend goes on accepting it. `docs/consumer-findings.md` §3.4 names this as the one
    // place the 500-to-415 change could bite, and this is what "bite" looks like.
    server.use(http.post(apiUrl('/auth/logout'), () => failure(415, 'Content-Type is required')))

    await expect(authService.logout()).rejects.toThrow('Content-Type is required')

    // The service raises it. Whether anybody acts on it is `AuthContext`'s decision, and it
    // deliberately does not — see the sign-out test in `AuthContext.integration.test.tsx`.
    expect(requestTo('POST', `${BASE}/auth/logout`).contentType).toBeNull()
  })
})
