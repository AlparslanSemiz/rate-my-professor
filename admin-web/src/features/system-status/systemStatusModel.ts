import { ApiError } from '../../api/ApiClient'
import type { SystemHealth } from '../../api/SystemStatusService'
import { getErrorMessage } from '../../utils/getErrorMessage'

const STATUS_API_UNAVAILABLE_MESSAGE =
  'The configured backend does not expose a system status endpoint yet. Deploy /system/status, then try again.'

export const STALE_READING_SUFFIX = 'Showing the last successful reading.'

export function getSystemStatusErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.status === 404) return STATUS_API_UNAVAILABLE_MESSAGE
  return getErrorMessage(error, fallback)
}

export const healthColor: Record<SystemHealth, string> = {
  OK: 'green',
  DEGRADED: 'orange',
  DOWN: 'red',
}

export const healthAccent: Record<SystemHealth, string> = {
  OK: '#22c55e',
  DEGRADED: '#f97316',
  DOWN: '#ef4444',
}

export const healthDescription: Record<SystemHealth, string> = {
  OK: 'The database answered and the counters were read.',
  DEGRADED: 'The database answered, but a count query failed — counters are unavailable.',
  DOWN: 'The database is unreachable, so counters and the last write cannot be read.',
}

const SECONDS_PER_MINUTE = 60
const SECONDS_PER_HOUR = 3600
const SECONDS_PER_DAY = 86_400

/** Renders an uptime in seconds as a short "2d 4h 15m" string. */
export function formatUptime(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return 'Unknown'
  if (seconds < SECONDS_PER_MINUTE) return `${Math.floor(seconds)}s`

  const days = Math.floor(seconds / SECONDS_PER_DAY)
  const hours = Math.floor((seconds % SECONDS_PER_DAY) / SECONDS_PER_HOUR)
  const minutes = Math.floor((seconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE)

  const parts: string[] = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`)
  return parts.join(' ')
}

/** Renders how long ago the last write happened, e.g. "12s ago". */
export function formatAge(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return 'Unknown'
  if (seconds < SECONDS_PER_MINUTE) return `${Math.floor(seconds)}s ago`
  return `${formatUptime(seconds)} ago`
}

export function formatCount(value: number): string {
  return Number.isFinite(value) ? value.toLocaleString('en-GB') : '—'
}

/**
 * Turns a backend counter key into a readable label. The backend is free to add counters, so
 * both `openBugReports` and `OPEN_BUG_REPORTS` have to render sensibly.
 */
export function humanizeKey(key: string): string {
  const words = key.includes('_')
    ? key.split('_').filter(Boolean).map((word) => word.toLowerCase())
    : key
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .split(' ')
        .filter(Boolean)
        .map((word) => word.toLowerCase())

  if (words.length === 0) return key
  return words[0].charAt(0).toUpperCase() + words[0].slice(1) + (words.length > 1 ? ` ${words.slice(1).join(' ')}` : '')
}
