/** Shown under the filter form. Exported so a test asserts the message, not a substring. */
export const INVALID_DATE_RANGE_MESSAGE = 'The start date must be before or equal to the end date.'

/**
 * Validates the `from`/`to` pair of a log filter form. Both values are `yyyy-mm-dd` strings
 * from a date input, so comparing them lexicographically is the same as comparing dates.
 * Returns an empty string when the range is usable.
 */
export function validateDateRange({ from, to }: { from: string; to: string }): string {
  if (!from || !to || from <= to) return ''
  return INVALID_DATE_RANGE_MESSAGE
}
