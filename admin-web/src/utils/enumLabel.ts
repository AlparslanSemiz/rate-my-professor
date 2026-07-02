/** Converts a backend SCREAMING_SNAKE_CASE enum value into a readable label, e.g. "ACTION_TAKEN" -> "Action Taken". */
export function enumLabel(value: string): string {
  return value
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')
}
