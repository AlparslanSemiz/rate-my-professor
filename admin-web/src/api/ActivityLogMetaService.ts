import { expectArray, type ApiClient } from './ApiClient'
import type {
  ActivityAction,
  ActivityMeta,
  ActivityMetaResponse,
  ActivityTargetType,
} from './activityLogTypes'

export class ActivityLogMetaService {
  private readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  async getMeta(): Promise<ActivityMeta> {
    const response = await this.client.get<ActivityMetaResponse>('/activity-logs/meta')
    return {
      actors: expectArray<ActivityMeta['actors'][number]>(response, 'actors', 'GET /activity-logs/meta'),
      actions: expectArray<ActivityAction>(response, 'actions', 'GET /activity-logs/meta'),
      targetTypes: expectArray<ActivityTargetType>(response, 'targetTypes', 'GET /activity-logs/meta'),
      actorTypes: response.actorTypes ?? [],
    }
  }
}
