import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { AuthProvider } from './AuthContext'
import { useAuth } from './useAuth'
import { apiClient } from '@/api/client'
import { apiUrl } from '@/test/msw/apiUrl'
import { failure } from '@/test/msw/envelope'
import { failSessionCheck, setSessionUser } from '@/test/msw/handlers/auth'
import { requestsTo } from '@/test/msw/requests'
import { server, startMockBackend } from '@/test/msw/server'

/**
 * Named `.integration.` and not `.unit.`, because that is what it is: it renders a React tree,
 * drives it with `user-event`, and now runs the real `ApiClient` against a request layer. The
 * plan's own definition — "a unit test isolates one unit; it is not a scenario" — was being
 * broken by the filename, and the two `npm run test:*` scripts filter on exactly that.
 */
startMockBackend()

const testUser = {
  id: 'admin-1',
  name: 'Test Admin',
  email: 'test@example.com',
  role: 'ADMIN',
}

function AuthHarness() {
  const { user, token, login, logout, isAuthenticated, sessionCheckError } = useAuth()

  return (
    <div>
      <p data-testid="auth-state">
        {isAuthenticated ? 'authenticated' : 'anonymous'}
      </p>
      <p data-testid="token">{token ?? 'no-token'}</p>
      <p data-testid="user-email">{user?.email ?? 'no-user'}</p>
      <p data-testid="user-name">{user?.name ?? 'no-user'}</p>
      <p data-testid="session-check-error">{sessionCheckError ?? 'none'}</p>
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

  it('keeps a stored session that carries the elevated flag', () => {
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('user', JSON.stringify({ ...testUser, isSuperAdmin: true }))

    renderAuthHarness()

    expect(screen.getByTestId('auth-state')).toHaveTextContent('authenticated')
  })

  it('rejects a stored session whose elevated flag is not a boolean', () => {
    // Not a payload this panel ever wrote, so nothing about it can be trusted.
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('user', JSON.stringify({ ...testUser, isSuperAdmin: 'yes' }))

    renderAuthHarness()

    expect(screen.getByTestId('auth-state')).toHaveTextContent('anonymous')
    expect(localStorage.getItem('user')).toBeNull()
  })

  it('replaces the stored user with the one /auth/me reports', async () => {
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('user', JSON.stringify(testUser))
    // The account was renamed and promoted after this session was stored.
    const current = { ...testUser, name: 'Renamed Admin', role: 'SUPERADMIN', isSuperAdmin: false }
    setSessionUser({
      id: current.id,
      username: current.name,
      kitEmail: current.email,
      role: current.role,
    })

    renderAuthHarness()

    await waitFor(() => expect(screen.getByTestId('user-name')).toHaveTextContent('Renamed Admin'))
    // And persisted, so the next load starts from the corrected copy rather than the stale one.
    expect(JSON.parse(localStorage.getItem('user') ?? '{}')).toEqual(current)
  })

  it('withdraws an elevation /auth/me no longer reports', async () => {
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('user', JSON.stringify({ ...testUser, isSuperAdmin: true }))
    const current = { ...testUser, isSuperAdmin: false }
    setSessionUser({
      id: current.id,
      username: current.name,
      kitEmail: current.email,
      role: current.role,
      isSuperAdmin: false,
    })

    renderAuthHarness()

    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem('user') ?? '{}')).toEqual(current)
    )
  })

  it('keeps the stored user when /auth/me names nobody', async () => {
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('user', JSON.stringify(testUser))
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

    await waitFor(() => expect(requestsTo('POST', '/api/auth/logout')).toHaveLength(1))
    expect(screen.getByTestId('auth-state')).toHaveTextContent('anonymous')
    expect(screen.getByTestId('token')).toHaveTextContent('no-token')
    expect(screen.getByTestId('user-email')).toHaveTextContent('no-user')
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })

  it('still clears local state when the explicit logout request fails', async () => {
    server.use(http.post(apiUrl('/auth/logout'), () => failure(503, 'Network unavailable')))
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
    server.use(http.get(apiUrl('/users'), () => failure(401, 'Unauthorized')))
    renderAuthHarness()

    // Any authenticated request coming back 401 ends the session, not just `/auth/me` —
    // the client reports it through one handler and the provider acts on it.
    await expect(apiClient.get('/users')).rejects.toThrow('Unauthorized')

    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('anonymous'))
    // Ended locally, without asking the backend to revoke a token it has already refused.
    expect(requestsTo('POST', '/api/auth/logout')).toHaveLength(0)
  })

  it('keeps the session but reports it when /auth/me answers 404', async () => {
    // F-013. The legacy path being gone is not a refusal, so the session survives — but the
    // stored account is now a copy nothing has confirmed, and the operator was told nothing.
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('user', JSON.stringify(testUser))
    server.use(failSessionCheck(404, 'No handler for GET /auth/me'))

    renderAuthHarness()

    await waitFor(() =>
      expect(screen.getByTestId('session-check-error')).not.toHaveTextContent('none')
    )
    expect(screen.getByTestId('auth-state')).toHaveTextContent('authenticated')
    expect(localStorage.getItem('token')).toBe('stored-token')
  })

  it('reports a session check the backend answered but the panel could not read', async () => {
    // A `ContractError` is permanent in the same way a 404 is: retrying cannot fix a payload
    // whose shape the panel does not recognise.
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('user', JSON.stringify(testUser))
    server.use(http.get(apiUrl('/auth/me'), () => HttpResponse.text('<html>nope</html>')))

    renderAuthHarness()

    await waitFor(() =>
      expect(screen.getByTestId('session-check-error')).not.toHaveTextContent('none')
    )
    expect(screen.getByTestId('auth-state')).toHaveTextContent('authenticated')
  })

  it('stays quiet when the session check fails in a way that may pass on a retry', async () => {
    // A 500 answers `transient`, and so does an unreachable host. Warning about a blip that
    // heals itself is noise, and noise is how a warning that matters gets ignored.
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('user', JSON.stringify(testUser))
    server.use(failSessionCheck(500, 'Backend is having a moment'))

    renderAuthHarness()

    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('authenticated'))
    expect(screen.getByTestId('session-check-error')).toHaveTextContent('none')
  })

  it('reports nothing when the session check succeeds', async () => {
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('user', JSON.stringify(testUser))
    setSessionUser({
      id: testUser.id,
      username: testUser.name,
      kitEmail: testUser.email,
      role: testUser.role,
    })

    renderAuthHarness()

    await waitFor(() => expect(screen.getByTestId('user-name')).toHaveTextContent(testUser.name))
    expect(screen.getByTestId('session-check-error')).toHaveTextContent('none')
  })
})
