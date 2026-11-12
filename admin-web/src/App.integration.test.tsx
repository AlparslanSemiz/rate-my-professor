import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import type { User } from '@/api/users'
import { apiClient } from '@/api/client'
import type { SystemStatus } from '@/api/system'
import { EMPTY_AUDIT_META } from '@/domain/auditLog'
import { apiUrl } from '@/test/msw/apiUrl'
import { seedDb } from '@/test/msw/db'
import { ok } from '@/test/msw/envelope'
import {
  expireStoredSessionOnce,
  rateLimitLoginCodes,
  setSessionUser,
} from '@/test/msw/handlers/auth'
import { requestTo, requestsTo } from '@/test/msw/requests'
import { server, startMockBackend } from '@/test/msw/server'
import { accentForRoute } from './constants/colors'
import { routes } from './constants/routes'
import { withAlpha } from './utils/color'
import App from './App'
import { SESSION_EXPIRED_MESSAGE } from './features/auth/hooks/useLoginFlow'

/**
 * Routing and the session, over the real request layer.
 *
 * The three behaviours this file exists for are documented as *decisions* rather than
 * implemented in one place, so they are the ones most worth exercising end to end: a refused
 * token ends the session and the attempted path travels in `state.from`; an unreachable
 * backend does **not**; and the panel's identity comes from `/auth/me` and nowhere else.
 * Under a service mock the last of those could only be asserted as "a function was not
 * called". Here it is asserted as "no request went to `/users`".
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

const requiredAdminAccount: User = {
  ...adminAccount,
  id: 'required-admin-1',
  username: 'Required Admin',
  kitEmail: 'unzhz@student.kit.edu',
  role: 'STUDENT',
}

const requiredAdminUser = {
  id: requiredAdminAccount.id,
  name: requiredAdminAccount.username,
  email: requiredAdminAccount.kitEmail,
  role: 'ADMIN',
}

/**
 * What `/auth/me` reports for an account. The backend spells these `username` and `kitEmail`
 * on this endpoint, which is the pair the panel used to read as `name` and `email` — `F-002`.
 */
function sessionFor(account: User, role: string = account.role) {
  return { id: account.id, username: account.username, kitEmail: account.kitEmail, role }
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

/**
 * @param message the sentence the sign-in screen should be showing
 * @returns the alert carrying it
 *
 * Scoped to the alert rather than to the document. Since `F-031` the refused sentence is also
 * carried, hidden, in the email field's description so that a screen reader reaching the field
 * hears why it was refused - so an unscoped `getByText` now legitimately matches twice. What
 * these tests mean is that the message is *on screen*, which is the alert's copy.
 */
async function findAlertWith(message: string | RegExp) {
  const alert = await screen.findByRole('alert')
  return within(alert).getByText(message)
}

describe('App routing and authentication', () => {
  beforeEach(() => {
    apiClient.setToken(null)
    seedDb({ users: [adminAccount], systemStatus, auditLogs: [], auditMeta: EMPTY_AUDIT_META })
    // `/auth/me` reports the signed-in account, which is where the panel's identity comes from.
    setSessionUser(sessionFor(adminAccount))
  })

  it('redirects anonymous users to the login screen', async () => {
    window.history.pushState({}, '', '/dashboard')

    render(<App />)

    expect(await screen.findByText("Pop in your KIT student email and we'll send over a login code.")).toBeInTheDocument()
    expect(window.location.pathname).toBe('/login')
  })

  it('renders protected content when auth is restored from storage', async () => {
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('user', JSON.stringify(adminUser))
    window.history.pushState({}, '', '/dashboard')

    render(<App />)

    expect(await screen.findByText("A quick look at how your community's doing today.")).toBeInTheDocument()
    expect(screen.getAllByText(adminUser.email).length).toBeGreaterThan(0)
  })

  it('sends a signed-in admin away from the login screen', async () => {
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('user', JSON.stringify(adminUser))
    window.history.pushState({}, '', '/login')

    render(<App />)

    expect(await screen.findByText("A quick look at how your community's doing today.")).toBeInTheDocument()
    expect(window.location.pathname).toBe('/dashboard')
    expect(screen.queryByPlaceholderText('admin@student.kit.edu')).not.toBeInTheDocument()
  })

  it('lists the catalogue directly under the dashboard', async () => {
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('user', JSON.stringify(adminUser))
    window.history.pushState({}, '', '/dashboard')

    render(<App />)

    const mainNavigation = await screen.findByRole('navigation', { name: 'Main navigation' })
    const order = within(mainNavigation)
      .getAllByRole('button')
      .map((button) => button.textContent ?? '')

    expect(order[0]).toMatch(/^Dashboard/)
    expect(order[1]).toMatch(/^Lectures & Professors/)
  })

  it('draws the active sidebar item in its own section colour', async () => {
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('user', JSON.stringify(adminUser))
    window.history.pushState({}, '', '/users')

    render(<App />)

    const mainNavigation = await screen.findByRole('navigation', { name: 'Main navigation' })
    const active = within(mainNavigation).getByRole('button', { current: 'page' })

    // The same colour the dashboard's "People" module card and "Total users" stat card use;
    // before, every active item was the same green whatever section it led to. Asserted
    // through the token rather than a literal, so moving the palette does not break this.
    expect(active.firstElementChild).toHaveStyle({
      background: withAlpha(accentForRoute(routes.users), 0.18),
    })
  })

  it('routes authenticated admins to the Audit Logs page', async () => {
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('user', JSON.stringify(adminUser))
    window.history.pushState({}, '', '/audit-logs')

    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Audit Logs' })).toBeInTheDocument()
    const oversightNavigation = screen.getByRole('navigation', { name: 'Oversight navigation' })
    expect(oversightNavigation).toHaveTextContent('Audit Logs')
    expect(oversightNavigation).toHaveTextContent('Admin activity')
    expect(oversightNavigation).toHaveTextContent('Help')
    // Removed 2026-08-21. `/system/status` is still read by the dashboard, the Users stat
    // cards and the GitLab button — it is the screen that went, not the endpoint.
    expect(oversightNavigation).not.toHaveTextContent('System Status')
    // Deleted 2026-09-09 and back 2026-09-10 (ADR 0016). The endpoints never stopped serving;
    // it was the screen that went, and the decision that took it away was reversed.
    expect(oversightNavigation).toHaveTextContent('Activity Logs')
  })

  it('has no System Status route left: the path falls back to the dashboard', async () => {
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('user', JSON.stringify(adminUser))
    window.history.pushState({}, '', '/system-status')

    render(<App />)

    await waitFor(() => expect(window.location.pathname).toBe('/dashboard'))
  })

  it('serves the Activity Logs page again, rather than falling back to the dashboard', async () => {
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('user', JSON.stringify(adminUser))
    window.history.pushState({}, '', '/activity-logs')

    render(<App />)

    // The inverse of the assertion that stood here from 2026-09-09: the path used to fall
    // through to the dashboard like any unknown one, and a test pinned that it did.
    expect(await screen.findByRole('heading', { name: 'Activity Logs' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/activity-logs')
  })

  it('names the product in the sidebar', async () => {
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('user', JSON.stringify(adminUser))
    window.history.pushState({}, '', '/dashboard')

    render(<App />)

    expect(await screen.findByAltText('RateMyProfessor Admin Panel')).toBeInTheDocument()
  })

  it('logs in with a valid one-time code and navigates to the dashboard', async () => {
    const user = userEvent.setup()
    window.history.pushState({}, '', '/login')

    render(<App />)

    await user.type(screen.getByPlaceholderText('admin@student.kit.edu'), adminUser.email)
    await user.click(screen.getByRole('button', { name: 'Send me a code' }))
    expect(await screen.findByText(`We just sent a code to ${adminUser.email}. Enter it below.`)).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText('Code from your email'), '123456')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => expect(requestsTo('POST', '/api/auth/login')).toHaveLength(1))
    expect(requestTo('POST', '/api/auth/login').body).toEqual({
      email: adminUser.email,
      loginToken: '123456',
    })
    expect(await screen.findByText("A quick look at how your community's doing today.")).toBeInTheDocument()
    expect(localStorage.getItem('token')).toBe('admin-token')
    // `isSuperAdmin` is part of the stored session and was absent from this expectation while
    // the service was mocked — the mock returned the panel's own object rather than one built
    // from a payload, so the mapping never ran.
    expect(JSON.parse(localStorage.getItem('user') ?? '{}')).toEqual({
      ...adminUser,
      isSuperAdmin: false,
    })
  })

  it('refuses an address outside the admin team without sending a code', async () => {
    const user = userEvent.setup()
    window.history.pushState({}, '', '/login')

    render(<App />)

    await user.type(screen.getByPlaceholderText('admin@student.kit.edu'), 'someone@student.kit.edu')
    await user.click(screen.getByRole('button', { name: 'Send me a code' }))

    expect(
      await findAlertWith(
        'You do not have access to this panel. It is limited to the admin team, so no login code was sent.',
      ),
    ).toBeInTheDocument()
    // No request at all: the address is checked before the backend is asked anything.
    expect(requestsTo('POST', '/api/auth/request-login')).toHaveLength(0)
    expect(screen.queryByPlaceholderText('Code from your email')).not.toBeInTheDocument()
  })

  it('does not submit a code that is too short to be one', async () => {
    const user = userEvent.setup()
    window.history.pushState({}, '', '/login')

    render(<App />)

    await user.type(screen.getByPlaceholderText('admin@student.kit.edu'), adminUser.email)
    await user.click(screen.getByRole('button', { name: 'Send me a code' }))

    const codeInput = await screen.findByPlaceholderText('Code from your email')
    await user.type(codeInput, '12345')
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled()

    // The field refuses the seventh character, so a mistyped code cannot be sent either.
    await user.type(codeInput, '67')
    expect(codeInput).toHaveValue('123456')

    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() =>
      expect(requestTo('POST', '/api/auth/login').body).toEqual({
        email: adminUser.email,
        loginToken: '123456',
      }),
    )
  })

  it('tells the operator to wait when the code was requested too often', async () => {
    const user = userEvent.setup()
    server.use(rateLimitLoginCodes())
    window.history.pushState({}, '', '/login')

    render(<App />)

    await user.type(screen.getByPlaceholderText('admin@student.kit.edu'), adminUser.email)
    await user.click(screen.getByRole('button', { name: 'Send me a code' }))

    expect(
      await findAlertWith(
        'Too many login codes have been requested. Wait a minute, then ask for a new one.',
      ),
    ).toBeInTheDocument()
    // No code was sent, so the form stays on the email step rather than asking for one.
    expect(screen.queryByPlaceholderText('Code from your email')).not.toBeInTheDocument()
  })

  it('greets the signed-in admin by name', async () => {
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('user', JSON.stringify(adminUser))
    window.history.pushState({}, '', '/dashboard')

    render(<App />)

    expect(await screen.findByText(`Welcome back, ${adminUser.name}`)).toBeInTheDocument()
  })

  it('logs in the required admin email as admin even when the backend user role is student', async () => {
    const user = userEvent.setup()
    // The backend reports this account as a student; the panel promotes the six known admin
    // addresses itself, and the role it *renders* is what this test is about.
    setSessionUser(sessionFor(requiredAdminAccount, 'STUDENT'))
    window.history.pushState({}, '', '/login')

    render(<App />)

    await user.type(screen.getByPlaceholderText('admin@student.kit.edu'), requiredAdminUser.email)
    await user.click(screen.getByRole('button', { name: 'Send me a code' }))
    await user.type(await screen.findByPlaceholderText('Code from your email'), '123456')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() =>
      expect(requestTo('POST', '/api/auth/login').body).toEqual({
        email: requiredAdminUser.email,
        loginToken: '123456',
      }),
    )
    expect(await screen.findByText("A quick look at how your community's doing today.")).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('user') ?? '{}')).toEqual({
      ...requiredAdminUser,
      isSuperAdmin: false,
    })
  })

  it('refuses the login when the session cannot say who the admin is', async () => {
    const user = userEvent.setup()
    // `/auth/me` is the only source of an id the backend actually issued. The panel used to
    // invent one from the email address and send it back as the issuer of every warning.
    server.use(http.get(apiUrl('/auth/me'), () => ok({}, 'Signed in')))
    window.history.pushState({}, '', '/login')

    render(<App />)

    await user.type(screen.getByPlaceholderText('admin@student.kit.edu'), requiredAdminUser.email)
    await user.click(screen.getByRole('button', { name: 'Send me a code' }))
    await user.type(await screen.findByPlaceholderText('Code from your email'), '123456')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText(/your admin account could not be read/)).toBeInTheDocument()
    expect(localStorage.getItem('user')).toBeNull()
  })

  it('takes the admin identity from /auth/me and never reads the user list', async () => {
    const user = userEvent.setup()
    window.history.pushState({}, '', '/login')

    render(<App />)

    await user.type(screen.getByPlaceholderText('admin@student.kit.edu'), adminUser.email)
    await user.click(screen.getByRole('button', { name: 'Send me a code' }))
    await user.type(await screen.findByPlaceholderText('Code from your email'), '123456')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText("A quick look at how your community's doing today.")).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('user') ?? '{}')).toEqual({
      ...adminUser,
      isSuperAdmin: false,
    })
    // The identity came from `/auth/me` alone. The dashboard does read `/users`, but only
    // for the four newest accounts; nothing asks for the whole list, which is what building
    // an identity out of it would have needed. Under a service mock this was "a function was
    // not called"; here it is the query string that went out.
    const userReads = requestsTo('GET', '/api/users')
    expect(userReads.length).toBeGreaterThan(0)
    expect(userReads.filter((request) => request.path === '/api/users')).toHaveLength(0)
  })

  it('sends an expired session back to the login screen and says why', async () => {
    // The stored token is a claim, not proof. A backend that refuses it ends the session.
    // The backend refuses the stored token. Once: the operator signs in again afterwards.
    server.use(expireStoredSessionOnce())
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('user', JSON.stringify(adminUser))
    window.history.pushState({}, '', '/audit-logs')

    render(<App />)

    expect(await findAlertWith(SESSION_EXPIRED_MESSAGE)).toBeInTheDocument()
    expect(window.location.pathname).toBe('/login')
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('returns to the page the expired session was thrown out of', async () => {
    const user = userEvent.setup()
    // The backend refuses the stored token. Once: the operator signs in again afterwards.
    server.use(expireStoredSessionOnce())
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('user', JSON.stringify(adminUser))
    window.history.pushState({}, '', '/audit-logs')

    render(<App />)
    await findAlertWith(SESSION_EXPIRED_MESSAGE)

    await user.type(screen.getByPlaceholderText('admin@student.kit.edu'), adminUser.email)
    await user.click(screen.getByRole('button', { name: 'Send me a code' }))
    await user.type(await screen.findByPlaceholderText('Code from your email'), '123456')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    // Not the dashboard: the attempted path travelled with the redirect in `location.state`.
    expect(await screen.findByRole('heading', { name: 'Audit Logs' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/audit-logs')
  })

  it('keeps the session when the backend is merely unreachable', async () => {
    // Deliberate asymmetry: only a refusal ends a session. A network failure says nothing
    // about whether the token is still good, and signing the admin out over a blip would
    // lose their place for no reason. One careless refactor turns this into the opposite.
    // A transport failure, not a refusal: MSW's `HttpResponse.error()` is what `fetch`
    // rejecting looks like, and the client turns it into a `NetworkError`.
    server.use(http.get(apiUrl('/auth/me'), () => HttpResponse.error(), { once: true }))
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('user', JSON.stringify(adminUser))
    window.history.pushState({}, '', '/audit-logs')

    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Audit Logs' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/audit-logs')
    expect(localStorage.getItem('token')).toBe('stored-token')
  })
})
