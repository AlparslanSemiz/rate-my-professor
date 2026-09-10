import { EMPTY_VALUE } from './emptyValue'
/**
 * `withSeconds` is opt-in and only means anything alongside `withTime`. It exists for the
 * one place that refreshes faster than a minute — a timestamp that only counts minutes looks
 * frozen between reads that are 15 seconds apart.
 */
export function formatDate(
  iso: string,
  options?: { withTime?: boolean; withSeconds?: boolean },
): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return EMPTY_VALUE

  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(options?.withTime
      ? {
          hour: '2-digit',
          minute: '2-digit',
          ...(options.withSeconds ? { second: '2-digit' as const } : {}),
        }
      : {}),
  })
}
