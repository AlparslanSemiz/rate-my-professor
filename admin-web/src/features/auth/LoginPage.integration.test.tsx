import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/api/client'
import { authService, type AuthUser } from '@/api/auth'
import { AuthProvider } from '@/context/AuthContext'
import { withQueryClient } from '@/test/queryClient'
import LoginPage from './LoginPage'

vi.mock('@/api/auth', () => ({
  authService: {
    requestLoginCode: vi.fn(),
    login: vi.fn(),
    me: vi.fn(),
    logout: vi.fn(),
  },
}))

const ADMIN_EMAIL = 'u-kisi4@student.kit.edu'
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
    vi.mocked(authService.requestLoginCode).mockResolvedValue({ success: true, message: 'Sent' })
    vi.mocked(authService.login).mockResolvedValue({ token: 'admin-token' })
    vi.mocked(authService.me).mockResolvedValue({ success: true, message: 'OK', user: adminUser })
  })

  it('never asks the backend for a code for an address outside the admin team', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByPlaceholderText('admin@student.kit.edu'), 'student@student.kit.edu')
    await user.click(screen.getByRole('button', { name: 'Send me a code' }))

    expect(await screen.findByText(/no login code was sent/)).toBeInTheDocument()
    expect(authService.requestLoginCode).not.toHaveBeenCalled()
  })

  it('asks for the code once the address is one of the team', async () => {
    const user = userEvent.setup()
    renderLogin()

    expect(await reachCodeStep(user)).toBeInTheDocument()
    expect(authService.requestLoginCode).toHaveBeenCalledWith(ADMIN_EMAIL)
  })

  it('will not submit a code that is not complete', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(await reachCodeStep(user), '123')

    expect(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled()
    expect(authService.login).not.toHaveBeenCalled()
  })

  it('signs in with a complete code', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(await reachCodeStep(user), '123456')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => expect(authService.login).toHaveBeenCalledWith(ADMIN_EMAIL, '123456'))
  })

  it('reports a refused code and drops the token the attempt set', async () => {
    vi.mocked(authService.login).mockRejectedValueOnce(new Error('That code is not valid.'))
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
