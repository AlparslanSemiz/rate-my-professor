import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import HelpPage from './HelpPage'

function renderHelp() {
  return render(
    <MantineProvider>
      <HelpPage />
    </MantineProvider>
  )
}

describe('Help page', () => {
  it('lists every section collapsed, with its explanation revealed on expand', async () => {
    const user = userEvent.setup()
    renderHelp()

    expect(screen.getByRole('button', { name: 'Users' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Comments' })).toBeInTheDocument()
    expect(screen.getByText(/Access blocked by moderation/)).not.toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Users' }))

    await waitFor(() => expect(screen.getByText(/Access blocked by moderation/)).toBeVisible())
    expect(screen.getByText(/KIT email can never be changed here/)).toBeVisible()
  })
})
