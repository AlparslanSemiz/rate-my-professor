import { apiClient, type HttpTransport, type BasicResponse } from '@/api/client/ApiClient'
import { LectureCatalogService } from './LectureCatalogService'
import { ProfessorCatalogService } from './ProfessorCatalogService'
import type { Lecture, LectureUpdate, Professor, ProfessorUpdate } from './catalogTypes'

export type {
  Lecture,
  LectureUpdate,
  Professor,
  ProfessorRef,
  ProfessorUpdate,
} from './catalogTypes'

/**
 * The lecture and professor catalogue. The reads are the public `/data` endpoints the student
 * app uses; the writes on the same paths are admin-only.
 */
export class CatalogService {
  private readonly lectures: LectureCatalogService
  private readonly professors: ProfessorCatalogService

  constructor(client: HttpTransport) {
    this.lectures = new LectureCatalogService(client)
    this.professors = new ProfessorCatalogService(client)
  }

  /**
   * Every lecture, unpaged, **active or not**.
   *
   * This calls `/data/lectures/all`, the admin read. It used to call the public
   * `/data/lectures`, which filters to `active = true` - so switching a lecture off removed it
   * from the only list the panel had and there was no way back. `F-006`, closed 2026-09-10.
   * Which of them an operator sees is now a filter on the screen rather than a choice of
   * endpoint.
   *
   * @returns the catalogue
   * @throws {ContractError} when the response holds no `lectures` list
   */
  async getLectures(): Promise<Lecture[]> {
    return this.lectures.getAll()
  }

  /**
   * Every professor, unpaged, active or not, for the same reason as {@link getLectures}.
   *
   * @returns the professors
   * @throws {ContractError} when the response holds no `professors` list
   */
  async getProfessors(): Promise<Professor[]> {
    return this.professors.getAll()
  }

  /**
   * @param id the lecture to edit
   * @param update only the fields that changed; `professorIds` replaces the assignment whole
   * @returns the envelope
   */
  updateLecture(id: string, update: LectureUpdate): Promise<BasicResponse> {
    return this.lectures.update(id, update)
  }

  /**
   * Deletes a lecture **and everything hanging off it** — its comments, answers and ratings.
   * Not reversible.
   *
   * @param id the lecture to delete
   * @returns the envelope
   */
  deleteLecture(id: string): Promise<BasicResponse> {
    return this.lectures.delete(id)
  }

  /**
   * @param id the professor to edit
   * @param update only the fields that changed; `lectureIds` replaces the assignment whole
   * @returns the envelope
   */
  updateProfessor(id: string, update: ProfessorUpdate): Promise<BasicResponse> {
    return this.professors.update(id, update)
  }

  /**
   * Deletes a professor. The lectures stay — only the assignment goes.
   *
   * @param id the professor to delete
   * @returns the envelope
   */
  deleteProfessor(id: string): Promise<BasicResponse> {
    return this.professors.delete(id)
  }
}

/** The panel's catalogue service, bound to the shared client. */
export const catalogService = new CatalogService(apiClient)
