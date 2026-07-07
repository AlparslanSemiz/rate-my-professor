import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { User } from './api/UsersService'
import { apiClient } from './api/ApiClient'
import { authService } from './api/AuthService'
import { feedbackService } from './api/FeedbackService'
import { usersService } from './api/UsersService'
import App from './App'

vi.mock('./api/AuthService', () => ({
  authService: {
    requestLoginCode: vi.fn(),
    login: vi.fn(),
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

const adminAccount: User = {
  id: 'admin-1',
  username: 'Admin User',
  kitEmail: 'admin@student.kit.edu',
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

describe('App routing and authentication', () => {
  beforeEach(() => {
    apiClient.setToken(null)
    vi.mocked(authService.requestLoginCode).mockResolvedValue({ success: true, message: 'Code sent' })
    vi.mocked(authService.login).mockResolvedValue({ token: 'mock-token-1' })
    vi.mocked(usersService.getAll).mockResolvedValue([adminAccount])
    vi.mocked(feedbackService.getReports).mockResolvedValue([])
  })

  it('redirects anonymous users to the login screen', async () => {
    window.history.pushState({}, '', '/dashboard')

    render(<App />)

    expect(await screen.findByText('Enter your KIT student email to receive a login code.')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/login')
  })

  it('renders protected content when auth is restored from storage', async () => {
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('user', JSON.stringify(adminUser))
    window.history.pushState({}, '', '/dashboard')

    render(<App />)

    expect(await screen.findByText('Live user activity, moderation queue and system health at a glance.')).toBeInTheDocument()
    expect(screen.getAllByText(adminUser.email).length).toBeGreaterThan(0)
  })

  it('logs in with a valid one-time code and navigates to the dashboard', async () => {
    const user = userEvent.setup()
    window.history.pushState({}, '', '/login')

    render(<App />)

    await user.type(screen.getByPlaceholderText('admin@student.kit.edu'), adminUser.email)
    await user.click(screen.getByRole('button', { name: 'Send login code' }))
    expect(await screen.findByText(`Enter the code sent to ${adminUser.email}.`)).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText('Code from your email'), '123456')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => expect(authService.login).toHaveBeenCalledWith(adminUser.email, '123456'))
    expect(await screen.findByText('Live user activity, moderation queue and system health at a glance.')).toBeInTheDocument()
    expect(localStorage.getItem('token')).toBe('mock-token-1')
    expect(JSON.parse(localStorage.getItem('user') ?? '{}')).toEqual(adminUser)
  })
})
