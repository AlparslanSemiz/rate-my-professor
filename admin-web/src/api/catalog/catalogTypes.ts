import type { LectureType, SemesterSeason } from '@/domain/catalog'

export interface ProfessorRef {
  id: string
  firstName: string
  lastName: string
  active: boolean
}

export interface Lecture {
  id: string
  name: string
  code: string
  semesterYear: number
  semesterSeason: SemesterSeason
  active: boolean
  lectureType: LectureType
  professors: ProfessorRef[]
  commentCount: number
  ratingCount: number
}

export interface Professor {
  id: string
  firstName: string
  lastName: string
  active: boolean
  /** The lectures this professor teaches, as the backend records them. */
  lectureIds: string[]
  /**
   * `0` rather than `null` when nobody has rated the professor, so `ratingCount` is what
   * separates "rated badly" from "not rated". `null` is still accepted defensively.
   */
  averageRating: number | null
  ratingCount: number
}

/**
 * Partial edit of a lecture. An omitted field is left alone; at least one has to be supplied.
 * `professorIds` replaces the assignment wholesale — pass `[]` to clear it.
 *
 * `lectureType` decides which rating categories the lecture offers, so changing it changes
 * what future ratings can score.
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
 * detach the professor from every lecture.
 */
export interface ProfessorUpdate {
  firstName?: string
  lastName?: string
  active?: boolean
  lectureIds?: string[]
}
