import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

const adminUser = {
  id: 1,
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'Admin',
}

describe('App routing and authentication', () => {
  it('redirects anonymous users to the login screen', async () => {
    window.history.pushState({}, '', '/dashboard')

    render(<App />)

    expect(
      await screen.findByText('Enter your credentials to access the admin panel.')
    ).toBeInTheDocument()
    expect(window.location.pathname).toBe('/login')
  })

  it('renders protected content when auth is restored from storage', async () => {
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('user', JSON.stringify(adminUser))
    window.history.pushState({}, '', '/dashboard')

    render(<App />)

    expect(
      await screen.findByText('Live user activity, moderation queue and system health at a glance.')
    ).toBeInTheDocument()
    expect(screen.getByText(adminUser.email)).toBeInTheDocument()
  })

  it('logs in with valid credentials and navigates to the dashboard', async () => {
    const user = userEvent.setup()
    window.history.pushState({}, '', '/login')

    render(<App />)

    await user.type(screen.getByPlaceholderText('admin@example.com'), 'admin@example.com')
    await user.type(screen.getByPlaceholderText('Your password'), 'admin123')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    expect(
      await screen.findByText('Live user activity, moderation queue and system health at a glance.')
    ).toBeInTheDocument()
    expect(localStorage.getItem('token')).toBe('mock-token-1')
    expect(JSON.parse(localStorage.getItem('user') ?? '{}')).toEqual(adminUser)
  })
})
