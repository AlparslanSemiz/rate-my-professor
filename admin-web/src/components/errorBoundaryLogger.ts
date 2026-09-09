import type { ErrorInfo } from 'react'

export function logRenderError(error: Error, info: ErrorInfo): void {
  console.error('Unhandled render error', error, info.componentStack)
}
