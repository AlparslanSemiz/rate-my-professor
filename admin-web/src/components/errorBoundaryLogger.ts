import type { ErrorInfo } from 'react'

/**
 * Where a caught render error goes. Kept separate from the boundary itself so the boundary
 * stays a component and this stays the one place that decides what "logged" means.
 *
 * `error` is `unknown` rather than `Error` because that is what a `throw` can actually
 * produce — a string, or anything else — and the boundary must not itself fail while
 * reporting a failure.
 */
export function logRenderError(error: unknown, info: ErrorInfo): void {
  console.error('Unhandled render error', error, info.componentStack)
}
