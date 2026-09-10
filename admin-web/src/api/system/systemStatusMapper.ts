import type { BasicResponse } from '@/api/client/ApiClient'
import type { SystemCounts, SystemStatus } from './systemStatusTypes'

/** `/system/status` as it arrives, before the defaults below are applied. */
export interface SystemStatusResponse extends BasicResponse, Omit<SystemStatus, 'counts'> {
  counts?: Record<string, number> | null
}

/**
 * Lifts the counters the panel reads out of the open map.
 *
 * The **only** place the backend's counter names appear. A counter it did not serve is `null`
 * rather than zero, because "not read" and "none" are different facts that look identical as
 * a figure.
 *
 * @param counts the open map, or null when the database did not answer
 * @returns the four counters, each null where the backend served none
 */
function toSystemCounts(counts: Record<string, number> | null | undefined): SystemCounts | null {
  if (!counts) return null
  return {
    users: counts.users ?? null,
    activeUsers: counts.activeUsers ?? null,
    admins: counts.admins ?? null,
    openBugReports: counts.openBugReports ?? null,
  }
}

/**
 * Fills in the readings a backend may not send.
 *
 * `counts` and `lastWrite` stay `null` rather than becoming zero: a counter that was not read
 * is not a counter that read zero, and the dashboard shows a dash for the first and a figure
 * for the second.
 *
 * @param response the payload as it arrived
 * @returns the reading, with absent parts explicitly null
 */
export function toSystemStatus(response: SystemStatusResponse): SystemStatus {
  return {
    status: response.status,
    checkedAt: response.checkedAt,
    startedAt: response.startedAt ?? null,
    uptimeSeconds: response.uptimeSeconds ?? null,
    database: response.database,
    counts: toSystemCounts(response.counts),
    lastWrite: response.lastWrite ?? null,
    gitlabEnabled: response.gitlabEnabled ?? false,
  }
}
