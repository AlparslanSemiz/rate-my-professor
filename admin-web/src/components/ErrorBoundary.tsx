import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary'
import type { ReactNode } from 'react'
import LoadError from './LoadError'
import { logRenderError } from './errorBoundaryLogger'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Shown above the retry button. */
  message?: string
  retryLabel?: string
  /** Runs before the failed state is cleared — use it to reload or navigate away. */
  onReset?: () => void
}

const DEFAULT_MESSAGE = 'Something in this view stopped working.'

/**
 * Catches render-time failures so a payload that did not match, or a bug on one screen,
 * shows a retry instead of blanking the panel. The error is still logged: this makes a
 * failure survivable, not invisible.
 *
 * Only render errors reach here. Anything thrown from an event handler or an awaited call
 * is caught where it happens, which is why the pages handle those themselves.
 *
 * The class component this used to be is now `react-error-boundary`'s. The props are
 * unchanged, so both call sites and every test that pinned the old behaviour still apply —
 * what went is the hand-written `getDerivedStateFromError` / `componentDidCatch` pair and
 * the `console.error` it inlined, which was a second copy of `logRenderError` below it.
 */
export default function ErrorBoundary({
  children,
  message = DEFAULT_MESSAGE,
  retryLabel,
  onReset,
}: ErrorBoundaryProps) {
  return (
    <ReactErrorBoundary
      onError={logRenderError}
      onReset={() => onReset?.()}
      fallbackRender={({ resetErrorBoundary }) => (
        <LoadError message={message} onRetry={resetErrorBoundary} retryLabel={retryLabel} />
      )}
    >
      {children}
    </ReactErrorBoundary>
  )
}
