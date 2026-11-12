import { expectArray, type BasicResponse } from '@/api/client/ApiClient'
import { HttpService } from '@/api/client/HttpService'
import type { Lecture, LectureUpdate } from './catalogTypes'

interface LecturesResponse extends BasicResponse {
  lectures: Lecture[]
}

/** Lectures: the public read, and the admin-only writes on the same paths. */
export class LectureCatalogService extends HttpService {
  /**
   * Every lecture the catalogue holds, **active or not**.
   *
   * The admin read rather than the public one, and that is the whole of `F-006`: `/data/lectures`
   * filters to `active = true`, so a lecture the panel had just switched off left the only list
   * the panel could see and the `PATCH` that would switch it back on had nowhere to aim. The
   * `/all` pair exists for exactly this and the backend serves it on the legacy path too.
   */
  async getAll(): Promise<Lecture[]> {
    const response = await this.client.get<LecturesResponse>('/data/lectures/all')
    return expectArray<Lecture>(response, 'lectures', 'GET /data/lectures/all')
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
