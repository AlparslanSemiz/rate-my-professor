import { expectArray, type ApiClient, type BasicResponse } from './ApiClient'
import type { Lecture, LectureUpdate } from './catalogTypes'

interface LecturesResponse extends BasicResponse {
  lectures: Lecture[]
}

export class LectureCatalogService {
  private readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  async getAll(): Promise<Lecture[]> {
    const response = await this.client.get<LecturesResponse>('/data/lectures')
    return expectArray<Lecture>(response, 'lectures', 'GET /data/lectures')
  }

  update(id: string, update: LectureUpdate): Promise<BasicResponse> {
    return this.client.patch<BasicResponse>(`/data/lectures/${id}`, update)
  }

  delete(id: string): Promise<BasicResponse> {
    return this.client.delete<BasicResponse>(`/data/lectures/${id}`)
  }
}
