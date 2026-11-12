import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/api/client'
import type { AuthUser } from '@/api/auth'
import { AuthProvider } from '@/context/AuthContext'
import { withQueryClient } from '@/test/queryClient'
import { apiUrl } from '@/test/msw/apiUrl'
import { failure } from '@/test/msw/envelope'
import { setSessionUser } from '@/test/msw/handlers/auth'
import { requestTo, requestsTo } from '@/test/msw/requests'
import { server, startMockBackend } from '@/test/msw/server'
import LoginPage from './LoginPage'

/**
 * The sign-in flow over the real request layer.
 *
 * What matters here is which requests go out and which do not: the admin-list check is meant
 * to stop a code being *requested* at all for an address outside the team, and a mocked
 * service could only say that a function had not been called.
 */
startMockBackend()

const ADMIN_EMAIL = 'unzhz@student.kit.edu'
const adminUser: AuthUser = {
  id: 'admin-1',
  name: 'Alparslan',
  email: ADMIN_EMAIL,
  role: 'ADMIN',
  isSuperAdmin: true,
}

function renderLogin() {
  return render(
    <MantineProvider>
      <AuthProvider>
        {withQueryClient(
          <MemoryRouter initialEntries={['/login']}>
            <LoginPage />
          </MemoryRouter>
        )}
      </AuthProvider>
    </MantineProvider>
  )
}

async function reachCodeStep(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText('admin@student.kit.edu'), ADMIN_EMAIL)
  await user.click(screen.getByRole('button', { name: 'Send me a code' }))
  return screen.findByPlaceholderText('Code from your email')
}

describe('Login page', () => {
  beforeEach(() => {
    setSessionUser({
      id: adminUser.id,
      username: adminUser.name,
      kitEmail: adminUser.email,
      role: adminUser.role,
      isSuperAdmin: true,
    })
  })

  it('never asks the backend for a code for an address outside the admin team', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByPlaceholderText('admin@student.kit.edu'), 'student@student.kit.edu')
    await user.click(screen.getByRole('button', { name: 'Send me a code' }))

    // Scoped to the alert: since `F-031` the same sentence is also carried, hidden, in the
    // email field's description, so an unscoped match now finds it twice. This asserts the
    // copy the operator can see.
    const alert = await screen.findByRole('alert')
    expect(within(alert).getByText(/no login code was sent/)).toBeInTheDocument()
    // Nothing went out. The list is a usability gate, and this is the gate working.
    expect(requestsTo('POST', '/api/auth/request-login')).toHaveLength(0)
  })

  it('asks for the code once the address is one of the team', async () => {
    const user = userEvent.setup()
    renderLogin()

    expect(await reachCodeStep(user)).toBeInTheDocument()
    expect(requestTo('POST', '/api/auth/request-login').body).toEqual({ email: ADMIN_EMAIL })
  })

  it('will not submit a code that is not complete', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(await reachCodeStep(user), '123')

    expect(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled()
    expect(requestsTo('POST', '/api/auth/login')).toHaveLength(0)
  })

  it('signs in with a complete code', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(await reachCodeStep(user), '123456')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() =>
      expect(requestTo('POST', '/api/auth/login').body).toEqual({
        email: ADMIN_EMAIL,
        loginToken: '123456',
      }),
    )
  })

  it('reports a refused code and drops the token the attempt set', async () => {
    server.use(
      http.post(apiUrl('/auth/login'), () => failure(400, 'That code is not valid.'), {
        once: true,
      }),
    )
    const setToken = vi.spyOn(apiClient, 'setToken')
    const user = userEvent.setup()
    renderLogin()

    await user.type(await reachCodeStep(user), '999999')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('That code is not valid.')).toBeInTheDocument()
    // A half-finished attempt must not leave a token behind: the next request would go out
    // with it, come back 401, and report the session as expired when it never existed.
    expect(setToken).toHaveBeenCalledWith(null)
  })

  it('goes back to the address step, keeping the address to correct', async () => {
    const user = userEvent.setup()
    renderLogin()

    await reachCodeStep(user)
    await user.click(screen.getByRole('button', { name: 'Use a different email' }))

    expect(await screen.findByPlaceholderText('admin@student.kit.edu')).toHaveValue(ADMIN_EMAIL)
  })
})
