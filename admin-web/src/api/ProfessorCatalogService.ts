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

  async getAll(): Promise<Professor[]> {
    const response = await this.client.get<ProfessorsResponse>('/data/professor')
    return expectArray<Professor>(response, 'professors', 'GET /data/professor')
  }

  update(id: string, update: ProfessorUpdate): Promise<BasicResponse> {
    return this.client.patch<BasicResponse>(`/data/professor/${id}`, update)
  }

  delete(id: string): Promise<BasicResponse> {
    return this.client.delete<BasicResponse>(`/data/professor/${id}`)
  }
}
