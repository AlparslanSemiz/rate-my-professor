import { apiClient, type ApiClient, type BasicResponse } from './ApiClient'
import type { LectureType, SemesterSeason } from '../domain/catalog'

export interface ProfessorRef {
  id: string
  firstName: string
  lastName: string
}

export interface Lecture {
  id: string
  name: string
  code: string
  semesterYear: number
  semesterSeason: SemesterSeason
  active: boolean
  professors: ProfessorRef[]
  commentCount: number
  ratingCount: number
}

export interface Professor {
  id: string
  firstName: string
  lastName: string
  averageRating: number | null
  ratingCount: number
}

/**
 * Partial edit of a lecture. An omitted field is left alone; at least one has to be supplied.
 * `professorIds` replaces the assignment wholesale — pass `[]` to clear it.
 *
 * `lectureType` decides which rating categories the lecture offers, so changing it changes
 * what future ratings can score. It is write-only: the catalogue reads do not report the
 * lecture's current type, so the panel can set it but cannot show it.
 */
export interface LectureUpdate {
  name?: string
  code?: string
  semesterYear?: number
  semesterSeason?: SemesterSeason
  active?: boolean
  lectureType?: LectureType
  professorIds?: string[]
}

/**
 * Partial edit of a professor. `lectureIds` replaces the assignment wholesale — pass `[]` to
 * detach the professor from every lecture. `active` is write-only for the same reason
 * `lectureType` is on a lecture: the catalogue reads do not report it.
 */
export interface ProfessorUpdate {
  firstName?: string
  lastName?: string
  active?: boolean
  lectureIds?: string[]
}

interface LecturesResponse extends BasicResponse {
  lectures: Lecture[]
}

interface ProfessorsResponse extends BasicResponse {
  professors: Professor[]
}

/**
 * The lecture and professor catalogue. The reads are the public `/data` endpoints the student
 * app uses; the writes on the same paths are admin-only.
 */
export class CatalogService {
  private readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  async getLectures(): Promise<Lecture[]> {
    const response = await this.client.get<LecturesResponse>('/data/lectures')
    return response.lectures
  }

  async getProfessors(): Promise<Professor[]> {
    const response = await this.client.get<ProfessorsResponse>('/data/professor')
    return response.professors
  }

  updateLecture(id: string, update: LectureUpdate): Promise<BasicResponse> {
    return this.client.patch<BasicResponse>(`/data/lectures/${id}`, update)
  }

  /** Removes the lecture together with its comments, answers and ratings. */
  deleteLecture(id: string): Promise<BasicResponse> {
    return this.client.delete<BasicResponse>(`/data/lectures/${id}`)
  }

  updateProfessor(id: string, update: ProfessorUpdate): Promise<BasicResponse> {
    return this.client.patch<BasicResponse>(`/data/professor/${id}`, update)
  }

  /** Removes the professor. The lectures stay; only the assignment is dropped. */
  deleteProfessor(id: string): Promise<BasicResponse> {
    return this.client.delete<BasicResponse>(`/data/professor/${id}`)
  }
}

export const catalogService = new CatalogService(apiClient)
