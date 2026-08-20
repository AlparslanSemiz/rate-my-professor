import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { User } from './api/UsersService'
import { ApiError, apiClient } from './api/ApiClient'
import { authService } from './api/AuthService'
import { feedbackService } from './api/FeedbackService'
import { usersService } from './api/UsersService'
import { auditLogsService } from './api/AuditLogsService'
import App from './App'
import { SESSION_EXPIRED_MESSAGE } from './features/auth/hooks/useLoginFlow'

vi.mock('./api/AuthService', () => ({
  authService: {
    requestLoginCode: vi.fn(),
    login: vi.fn(),
    me: vi.fn(),
  },
}))

vi.mock('./api/FeedbackService', () => ({
  feedbackService: {
    getReports: vi.fn(),
  },
}))

vi.mock('./api/UsersService', () => ({
  usersService: {
    getAll: vi.fn(),
  },
}))

vi.mock('./api/AuditLogsService', () => ({
  auditLogsService: {
    getLogs: vi.fn(),
    getMeta: vi.fn(),
  },
}))

const adminAccount: User = {
  id: 'admin-1',
  username: 'Admin User',
  kitEmail: 'u-kisi5@student.kit.edu',
  role: 'ADMIN',
  status: 'ACTIVE',
  joined: '2025-01-10',
  lastOnline: '2026-06-11T18:30:00Z',
  biography: 'Platform administrator.',
  warnings: 0,
  reports: 0,
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
  kitEmail: 'u-kisi4@student.kit.edu',
  role: 'STUDENT',
}

const requiredAdminUser = {
  id: requiredAdminAccount.id,
  name: requiredAdminAccount.username,
  email: requiredAdminAccount.kitEmail,
  role: 'ADMIN',
}

describe('App routing and authentication', () => {
  beforeEach(() => {
    apiClient.setToken(null)
    vi.mocked(authService.requestLoginCode).mockResolvedValue({ success: true, message: 'Code sent' })
    vi.mocked(authService.login).mockResolvedValue({ token: 'mock-token-1' })
    vi.mocked(authService.me).mockResolvedValue({ success: true, message: 'Signed in' })
    vi.mocked(usersService.getAll).mockResolvedValue([adminAccount])
    vi.mocked(feedbackService.getReports).mockResolvedValue([])
    vi.mocked(auditLogsService.getLogs).mockResolvedValue({ auditLogs: [], nextCursor: null })
    vi.mocked(auditLogsService.getMeta).mockResolvedValue({
      actors: [],
      actions: [],
      targetTypes: [],
      actorTypes: [],
    })
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

  it('routes authenticated admins to the Audit Logs page', async () => {
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('user', JSON.stringify(adminUser))
    window.history.pushState({}, '', '/audit-logs')

    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Audit Logs' })).toBeInTheDocument()
    const oversightNavigation = screen.getByRole('navigation', { name: 'Oversight navigation' })
    expect(oversightNavigation).toHaveTextContent('Audit Logs')
    expect(oversightNavigation).toHaveTextContent('Admin activity')
    expect(oversightNavigation).toHaveTextContent('Activity Log')
    expect(oversightNavigation).toHaveTextContent('System Status')
  })

  it('logs in with a valid one-time code and navigates to the dashboard', async () => {
    const user = userEvent.setup()
    window.history.pushState({}, '', '/login')

    render(<App />)

    await user.type(screen.getByPlaceholderText('admin@student.kit.edu'), adminUser.email)
    await user.click(screen.getByRole('button', { name: 'Send me a code' }))
    expect(await screen.findByText(`We just sent a code to ${adminUser.email} — enter it below.`)).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText('Code from your email'), '123456')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => expect(authService.login).toHaveBeenCalledWith(adminUser.email, '123456'))
    expect(await screen.findByText("A quick look at how your community's doing today.")).toBeInTheDocument()
    expect(localStorage.getItem('token')).toBe('mock-token-1')
    expect(JSON.parse(localStorage.getItem('user') ?? '{}')).toEqual(adminUser)
  })

  it('refuses an address outside the admin team without sending a code', async () => {
    const user = userEvent.setup()
    window.history.pushState({}, '', '/login')

    render(<App />)

    await user.type(screen.getByPlaceholderText('admin@student.kit.edu'), 'someone@student.kit.edu')
    await user.click(screen.getByRole('button', { name: 'Send me a code' }))

    expect(await screen.findByText(
      'You do not have access to this panel. It is limited to the admin team, so no login code was sent.'
    )).toBeInTheDocument()
    expect(authService.requestLoginCode).not.toHaveBeenCalled()
    expect(screen.queryByPlaceholderText('Code from your email')).not.toBeInTheDocument()
  })

  it('tells the operator to wait when the code was requested too often', async () => {
    const user = userEvent.setup()
    vi.mocked(authService.requestLoginCode).mockRejectedValue(
      new ApiError(429, 'Request to /auth/request-login failed with status 429'),
    )
    window.history.pushState({}, '', '/login')

    render(<App />)

    await user.type(screen.getByPlaceholderText('admin@student.kit.edu'), adminUser.email)
    await user.click(screen.getByRole('button', { name: 'Send me a code' }))

    expect(
      await screen.findByText(
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
    vi.mocked(usersService.getAll).mockResolvedValue([requiredAdminAccount])
    window.history.pushState({}, '', '/login')

    render(<App />)

    await user.type(screen.getByPlaceholderText('admin@student.kit.edu'), requiredAdminUser.email)
    await user.click(screen.getByRole('button', { name: 'Send me a code' }))
    await user.type(await screen.findByPlaceholderText('Code from your email'), '123456')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => expect(authService.login).toHaveBeenCalledWith(requiredAdminUser.email, '123456'))
    expect(await screen.findByText("A quick look at how your community's doing today.")).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('user') ?? '{}')).toEqual(requiredAdminUser)
  })

  it('refuses the login when no source can say who the admin is', async () => {
    const user = userEvent.setup()
    // Neither `/auth/me` nor `/users` yields an identity. The panel used to invent one whose
    // id was the email address, and then send it back as the issuer of every warning.
    vi.mocked(usersService.getAll).mockRejectedValue(new Error('The server returned an empty response.'))
    window.history.pushState({}, '', '/login')

    render(<App />)

    await user.type(screen.getByPlaceholderText('admin@student.kit.edu'), requiredAdminUser.email)
    await user.click(screen.getByRole('button', { name: 'Send me a code' }))
    await user.type(await screen.findByPlaceholderText('Code from your email'), '123456')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText(/your admin account could not be read/)).toBeInTheDocument()
    expect(localStorage.getItem('user')).toBeNull()
  })

  it('takes the admin identity from /auth/me without reading the whole user list', async () => {
    const user = userEvent.setup()
    vi.mocked(authService.me).mockResolvedValue({ success: true, message: 'Signed in', user: adminUser })
    window.history.pushState({}, '', '/login')

    render(<App />)

    await user.type(screen.getByPlaceholderText('admin@student.kit.edu'), adminUser.email)
    await user.click(screen.getByRole('button', { name: 'Send me a code' }))
    await user.type(await screen.findByPlaceholderText('Code from your email'), '123456')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText("A quick look at how your community's doing today.")).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('user') ?? '{}')).toEqual(adminUser)
  })
  it('sends an expired session back to the login screen and says why', async () => {
    // The stored token is a claim, not proof. A backend that refuses it ends the session.
    vi.mocked(authService.me).mockRejectedValueOnce(new ApiError(401, 'Token expired'))
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('user', JSON.stringify(adminUser))
    window.history.pushState({}, '', '/audit-logs')

    render(<App />)

    expect(await screen.findByText(SESSION_EXPIRED_MESSAGE)).toBeInTheDocument()
    expect(window.location.pathname).toBe('/login')
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('returns to the page the expired session was thrown out of', async () => {
    const user = userEvent.setup()
    vi.mocked(authService.me).mockRejectedValueOnce(new ApiError(401, 'Token expired'))
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('user', JSON.stringify(adminUser))
    window.history.pushState({}, '', '/audit-logs')

    render(<App />)
    await screen.findByText(SESSION_EXPIRED_MESSAGE)

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
    vi.mocked(authService.me).mockRejectedValueOnce(new TypeError('Failed to fetch'))
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('user', JSON.stringify(adminUser))
    window.history.pushState({}, '', '/audit-logs')

    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Audit Logs' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/audit-logs')
    expect(localStorage.getItem('token')).toBe('stored-token')
  })
})
