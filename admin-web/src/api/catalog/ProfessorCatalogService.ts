import { expectArray, type BasicResponse } from '@/api/client/ApiClient'
import { HttpService } from '@/api/client/HttpService'
import type { Professor, ProfessorUpdate } from './catalogTypes'

interface ProfessorsResponse extends BasicResponse {
  professors: Professor[]
}

/** Professors: the public read, and the admin-only writes on the same paths. */
export class ProfessorCatalogService extends HttpService {
  /** Public professor catalogue read, backed by the singular backend path. */
  async getAll(): Promise<Professor[]> {
    const response = await this.client.get<ProfessorsResponse>('/data/professor')
    return expectArray<Professor>(response, 'professors', 'GET /data/professor')
  }

  /**
   * @param id the professor to edit
   * @param update only the fields that changed
   * @returns the envelope
   */
  update(id: string, update: ProfessorUpdate): Promise<BasicResponse> {
    return this.client.patch<BasicResponse>(`/data/professor/${id}`, update)
  }

  /** Removes the professor. The lectures stay; only the assignment is dropped. */
  delete(id: string): Promise<BasicResponse> {
    return this.client.delete<BasicResponse>(`/data/professor/${id}`)
  }
}
