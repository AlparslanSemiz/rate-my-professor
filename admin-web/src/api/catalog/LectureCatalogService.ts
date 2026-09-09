import { expectArray, type BasicResponse } from '@/api/client/ApiClient'
import { HttpService } from '@/api/client/HttpService'
import type { Lecture, LectureUpdate } from './catalogTypes'

interface LecturesResponse extends BasicResponse {
  lectures: Lecture[]
}

/** Lectures: the public read, and the admin-only writes on the same paths. */
export class LectureCatalogService extends HttpService {
  /** Public lecture catalogue read, backed by the same `/data` endpoint the student app uses. */
  async getAll(): Promise<Lecture[]> {
    const response = await this.client.get<LecturesResponse>('/data/lectures')
    return expectArray<Lecture>(response, 'lectures', 'GET /data/lectures')
  }

  /**
   * @param id the lecture to edit
   * @param update only the fields that changed
   * @returns the envelope
   */
  update(id: string, update: LectureUpdate): Promise<BasicResponse> {
    return this.client.patch<BasicResponse>(`/data/lectures/${id}`, update)
  }

  /** Removes the lecture together with its comments, answers and ratings. */
  delete(id: string): Promise<BasicResponse> {
    return this.client.delete<BasicResponse>(`/data/lectures/${id}`)
  }
}
