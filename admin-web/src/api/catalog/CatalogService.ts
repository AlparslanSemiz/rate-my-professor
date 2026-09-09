import { apiClient, type ApiClient, type BasicResponse } from '@/api/client/ApiClient'
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

  constructor(client: ApiClient) {
    this.lectures = new LectureCatalogService(client)
    this.professors = new ProfessorCatalogService(client)
  }

  async getLectures(): Promise<Lecture[]> {
    return this.lectures.getAll()
  }

  async getProfessors(): Promise<Professor[]> {
    return this.professors.getAll()
  }

  updateLecture(id: string, update: LectureUpdate): Promise<BasicResponse> {
    return this.lectures.update(id, update)
  }

  deleteLecture(id: string): Promise<BasicResponse> {
    return this.lectures.delete(id)
  }

  updateProfessor(id: string, update: ProfessorUpdate): Promise<BasicResponse> {
    return this.professors.update(id, update)
  }

  deleteProfessor(id: string): Promise<BasicResponse> {
    return this.professors.delete(id)
  }
}

export const catalogService = new CatalogService(apiClient)
