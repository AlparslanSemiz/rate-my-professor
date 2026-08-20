import { Component, type ErrorInfo, type ReactNode } from 'react'
import LoadError from './LoadError'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Shown above the retry button. */
  message?: string
  retryLabel?: string
  /** Runs before the failed state is cleared — use it to reload or navigate away. */
  onReset?: () => void
}

interface ErrorBoundaryState {
  failed: boolean
}

const DEFAULT_MESSAGE = 'Something in this view stopped working.'

/**
 * Catches render-time failures so a payload that did not match, or a bug on one screen,
 * shows a retry instead of blanking the panel. The error is still logged: this makes a
 * failure survivable, not invisible.
 *
 * Only render errors reach here. Anything thrown from an event handler or an awaited call
 * is caught where it happens, which is why the pages handle those themselves.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled render error', error, info.componentStack)
  }

  private readonly handleReset = (): void => {
    this.props.onReset?.()
    this.setState({ failed: false })
  }

  render(): ReactNode {
    if (!this.state.failed) return this.props.children

    return (
      <LoadError
        message={this.props.message ?? DEFAULT_MESSAGE}
        onRetry={this.handleReset}
        retryLabel={this.props.retryLabel}
      />
    )
  }
}
