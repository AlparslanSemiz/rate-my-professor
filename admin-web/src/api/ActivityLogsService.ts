import { apiClient, type ApiClient } from './ApiClient'
import { ActivityLogMetaService } from './ActivityLogMetaService'
import { ActivityLogReaderService } from './ActivityLogReaderService'
import type { ActivityLogFilters, ActivityLogPage, ActivityMeta } from './activityLogTypes'

export { ACTIVITY_ACTIONS, ACTIVITY_TARGET_TYPES } from './activityLogTypes'
export type {
  ActivityAction,
  ActivityActor,
  ActivityActorType,
  ActivityChange,
  ActivityLog,
  ActivityLogFilters,
  ActivityLogPage,
  ActivityMeta,
  ActivityTarget,
  ActivityTargetType,
  ActivityValue,
} from './activityLogTypes'

/**
 * The activity half of the audit table: what users did in the student app, plus every refused
 * request. Same entry shape, cursor contract and query parameters as `/audit-logs`; only the
 * action vocabulary differs, and the filter dropdowns take it from `/activity-logs/meta`.
 */
export class ActivityLogsService {
  private readonly reader: ActivityLogReaderService
  private readonly metadata: ActivityLogMetaService

  constructor(client: ApiClient) {
    this.reader = new ActivityLogReaderService(client)
    this.metadata = new ActivityLogMetaService(client)
  }

  async getLogs(
    filters: ActivityLogFilters = {},
    cursor?: string | null,
  ): Promise<ActivityLogPage> {
    return this.reader.getLogs(filters, cursor)
  }

  async getMeta(): Promise<ActivityMeta> {
    return this.metadata.getMeta()
  }
}

export const activityLogsService = new ActivityLogsService(apiClient)
