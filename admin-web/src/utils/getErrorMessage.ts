/**
 * Thrown when the runtime hit a bug rather than the backend refusing something. Their
 * messages ("Cannot read properties of undefined") describe our own code, so they belong in
 * the console, not in an alert the operator is asked to act on.
 */
const INTERNAL_ERROR_TYPES = [TypeError, RangeError, ReferenceError, SyntaxError] as const

export function getErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback
  if (INTERNAL_ERROR_TYPES.some((type) => error instanceof type)) return fallback
  return error.message.trim() ? error.message : fallback
}

/**
 * The message for a write the backend accepted whose follow-up read then failed.
 *
 * Reporting that as a failed action tells the operator nothing was saved, which is the one
 * thing we know is untrue. The policy across the panel is the opposite: the action is reported
 * as done, and the *view* is reported as stale.
 */
export function getStaleAfterWriteMessage(error: unknown, fallback: string): string {
  return `The change was saved, but reading it back failed, so what you see may be out of date: ${getErrorMessage(error, fallback)}`
}
