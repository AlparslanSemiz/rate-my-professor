import { expectArray, type BasicResponse } from '@/api/client/ApiClient'
import { HttpService } from '@/api/client/HttpService'
import type { Professor, ProfessorUpdate } from './catalogTypes'

interface ProfessorsResponse extends BasicResponse {
  professors: Professor[]
}

/** Professors: the public read, and the admin-only writes on the same paths. */
export class ProfessorCatalogService extends HttpService {
  /**
   * Every professor the catalogue holds, **active or not**, on the singular backend path.
   *
   * The admin read, for the reason `LectureCatalogService.getAll` gives: `/data/professor`
   * filters to `active = true` and a professor switched off would otherwise be unreachable.
   */
  async getAll(): Promise<Professor[]> {
    const response = await this.client.get<ProfessorsResponse>('/data/professor/all')
    return expectArray<Professor>(response, 'professors', 'GET /data/professor/all')
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
