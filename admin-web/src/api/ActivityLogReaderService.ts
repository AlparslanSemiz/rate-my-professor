import { expectArray, type ApiClient } from './ApiClient'
import { toLogQueryParams } from './logQueryParams'
import type {
  ActivityLog,
  ActivityLogFilters,
  ActivityLogPage,
  ActivityLogResponse,
} from './activityLogTypes'

export class ActivityLogReaderService {
  private readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  async getLogs(
    filters: ActivityLogFilters = {},
    cursor?: string | null,
  ): Promise<ActivityLogPage> {
    const response = await this.client.get<ActivityLogResponse>(
      '/activity-logs',
      toLogQueryParams(filters, cursor),
    )
    return {
      activityLogs: expectArray<ActivityLog>(response, 'activityLogs', 'GET /activity-logs'),
      nextCursor: response.nextCursor ?? null,
    }
  }
}
