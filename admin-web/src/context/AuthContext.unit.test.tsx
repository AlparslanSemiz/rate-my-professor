import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from './AuthContext'
import { useAuth } from './useAuth'
import { authService } from '../api/AuthService'
import { apiClient } from '../api/ApiClient'
import { jsonResponse } from '../test/http'

vi.mock('../api/AuthService', () => ({
  authService: {
    logout: vi.fn(),
    me: vi.fn(),
  },
}))

const testUser = {
  id: 'admin-1',
  name: 'Test Admin',
  email: 'test@example.com',
  role: 'ADMIN',
}

function AuthHarness() {
  const { user, token, login, logout, isAuthenticated } = useAuth()

  return (
    <div>
      <p data-testid="auth-state">
        {isAuthenticated ? 'authenticated' : 'anonymous'}
      </p>
      <p data-testid="token">{token ?? 'no-token'}</p>
      <p data-testid="user-email">{user?.email ?? 'no-user'}</p>
      <p data-testid="user-name">{user?.name ?? 'no-user'}</p>
      <button type="button" onClick={() => login('test-token', testUser)}>
        Log in
      </button>
      <button type="button" onClick={() => void logout()}>
        Log out
      </button>
    </div>
  )
}

function renderAuthHarness() {
  return render(
    <AuthProvider>
      <AuthHarness />
    </AuthProvider>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.mocked(authService.logout).mockResolvedValue({ success: true, message: 'Logged out' })
    vi.mocked(authService.me).mockResolvedValue({ success: true, message: 'Signed in' })
  })

  it('hydrates auth state from localStorage', () => {
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('user', JSON.stringify(testUser))

    renderAuthHarness()

    expect(screen.getByTestId('auth-state')).toHaveTextContent('authenticated')
    expect(screen.getByTestId('token')).toHaveTextContent('stored-token')
    expect(screen.getByTestId('user-email')).toHaveTextContent(testUser.email)
  })

  it('does not authenticate partial stored sessions', () => {
    localStorage.setItem('token', 'stored-token')

    renderAuthHarness()

    expect(screen.getByTestId('auth-state')).toHaveTextContent('anonymous')
    expect(screen.getByTestId('token')).toHaveTextContent('no-token')
    expect(screen.getByTestId('user-email')).toHaveTextContent('no-user')
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('clears malformed stored sessions instead of crashing', () => {
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('user', '{bad json')

    renderAuthHarness()

    expect(screen.getByTestId('auth-state')).toHaveTextContent('anonymous')
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })

  it('rejects stored sessions whose user payload is missing required fields', () => {
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('user', JSON.stringify({
      id: 'admin-1',
      name: 'Test Admin',
      email: 'test@example.com',
    }))

    renderAuthHarness()

    expect(screen.getByTestId('auth-state')).toHaveTextContent('anonymous')
    expect(screen.getByTestId('token')).toHaveTextContent('no-token')
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })

  it('replaces the stored user with the one /auth/me reports', async () => {
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('user', JSON.stringify(testUser))
    // The account was renamed and promoted after this session was stored.
    const current = { ...testUser, name: 'Renamed Admin', role: 'SUPERADMIN' }
    vi.mocked(authService.me).mockResolvedValue({ success: true, message: 'ok', user: current })

    renderAuthHarness()

    await waitFor(() => expect(screen.getByTestId('user-name')).toHaveTextContent('Renamed Admin'))
    // And persisted, so the next load starts from the corrected copy rather than the stale one.
    expect(JSON.parse(localStorage.getItem('user') ?? '{}')).toEqual(current)
  })

  it('keeps the stored user when /auth/me names nobody', async () => {
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('user', JSON.stringify(testUser))
    vi.mocked(authService.me).mockResolvedValue({ success: true, message: 'ok' })

    renderAuthHarness()

    // A response that carries no user is not a correction — the session stays as it was.
    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('authenticated'))
    expect(screen.getByTestId('user-name')).toHaveTextContent(testUser.name)
  })

  it('persists login and clears state on logout', async () => {
    const user = userEvent.setup()
    renderAuthHarness()

    await user.click(screen.getByRole('button', { name: 'Log in' }))

    expect(screen.getByTestId('auth-state')).toHaveTextContent('authenticated')
    expect(localStorage.getItem('token')).toBe('test-token')
    expect(localStorage.getItem('user')).toBe(JSON.stringify(testUser))

    await user.click(screen.getByRole('button', { name: 'Log out' }))

    expect(authService.logout).toHaveBeenCalledOnce()
    expect(screen.getByTestId('auth-state')).toHaveTextContent('anonymous')
    expect(screen.getByTestId('token')).toHaveTextContent('no-token')
    expect(screen.getByTestId('user-email')).toHaveTextContent('no-user')
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })

  it('still clears local state when the explicit logout request fails', async () => {
    vi.mocked(authService.logout).mockRejectedValue(new Error('Network unavailable'))
    const user = userEvent.setup()
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('user', JSON.stringify(testUser))
    renderAuthHarness()

    await user.click(screen.getByRole('button', { name: 'Log out' }))

    expect(screen.getByTestId('auth-state')).toHaveTextContent('anonymous')
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })

  it('clears an unauthorized session without sending an explicit logout request', async () => {
    localStorage.setItem('token', 'expired-token')
    localStorage.setItem('user', JSON.stringify(testUser))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({
      success: false,
      message: 'Unauthorized',
    }, 401)))
    renderAuthHarness()

    await expect(apiClient.get('/users')).rejects.toThrow('Unauthorized')

    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('anonymous'))
    expect(authService.logout).not.toHaveBeenCalled()
  })
})
