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
