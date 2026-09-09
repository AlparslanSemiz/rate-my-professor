import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ErrorBoundary from './ErrorBoundary'

/**
 * Named `.integration.` because it renders through `MantineProvider` over the third-party
 * `react-error-boundary` and drives it with `user-event`. It is a component scenario, not a
 * unit.
 */

// React reports every caught render error through `console.error`, and the boundary logs its
// own on top of that. Silencing it keeps a deliberate failure from reading like a broken suite.
let consoleError: ReturnType<typeof vi.spyOn>

function renderBoundary(ui: React.ReactNode, props: Record<string, unknown> = {}) {
  return render(
    <MantineProvider>
      <ErrorBoundary {...props}>{ui}</ErrorBoundary>
    </MantineProvider>
  )
}

function Exploding(): React.ReactNode {
  throw new Error('the payload did not match')
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleError.mockRestore()
  })

  it('renders its children while nothing throws', () => {
    renderBoundary(<div>the screen</div>)

    expect(screen.getByText('the screen')).toBeInTheDocument()
  })

  it('shows the supplied message and retry label instead of blanking the view', () => {
    renderBoundary(<Exploding />, {
      message: 'The panel hit an unexpected error.',
      retryLabel: 'Reload the panel',
    })

    expect(screen.getByRole('alert')).toHaveTextContent('The panel hit an unexpected error.')
    expect(screen.getByRole('button', { name: 'Reload the panel' })).toBeInTheDocument()
    expect(screen.queryByText('the screen')).not.toBeInTheDocument()
  })

  it('falls back to its own message when the caller supplies none', () => {
    renderBoundary(<Exploding />)

    expect(screen.getByRole('alert')).toHaveTextContent('Something in this view stopped working.')
  })

  it('still logs the error it swallowed', () => {
    renderBoundary(<Exploding />)

    expect(consoleError).toHaveBeenCalledWith(
      'Unhandled render error',
      expect.objectContaining({ message: 'the payload did not match' }),
      expect.anything()
    )
  })

  it('runs onReset and renders the children again once the cause is gone', async () => {
    const user = userEvent.setup()
    let broken = true
    const onReset = vi.fn(() => {
      broken = false
    })

    function SometimesExploding(): React.ReactNode {
      if (broken) throw new Error('the payload did not match')
      return <div>the screen</div>
    }

    renderBoundary(<SometimesExploding />, { onReset })

    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(onReset).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('the screen')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
