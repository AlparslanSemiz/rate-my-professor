import { expectArray, type ApiClient, type BasicResponse } from './ApiClient'
import type { Professor, ProfessorUpdate } from './catalogTypes'

interface ProfessorsResponse extends BasicResponse {
  professors: Professor[]
}

export class ProfessorCatalogService {
  private readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  /** Public professor catalogue read, backed by the singular backend path. */
  async getAll(): Promise<Professor[]> {
    const response = await this.client.get<ProfessorsResponse>('/data/professor')
    return expectArray<Professor>(response, 'professors', 'GET /data/professor')
  }

  update(id: string, update: ProfessorUpdate): Promise<BasicResponse> {
    return this.client.patch<BasicResponse>(`/data/professor/${id}`, update)
  }

  /** Removes the professor. The lectures stay; only the assignment is dropped. */
  delete(id: string): Promise<BasicResponse> {
    return this.client.delete<BasicResponse>(`/data/professor/${id}`)
  }
}
