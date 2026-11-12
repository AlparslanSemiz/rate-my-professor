import type { LectureType, SemesterSeason } from '@/domain/catalog'

/**
 * A professor as a lecture names them: enough to render the assignment, and no ratings.
 *
 * The lecture read is the only place the assignment appears — the professor read does not
 * report which lectures it teaches — so the reverse index is built from these.
 */
export interface ProfessorRef {
  id: string
  firstName: string
  lastName: string
  active: boolean
}

/** A lecture in the catalogue, with the counts the table shows beside it. */
export interface Lecture {
  id: string
  name: string
  code: string
  semesterYear: number
  semesterSeason: SemesterSeason
  active: boolean
  lectureType: LectureType
  readonly professors: readonly ProfessorRef[]
  commentCount: number
  ratingCount: number
}

/** A professor in the catalogue, with their aggregate rating. */
export interface Professor {
  id: string
  firstName: string
  lastName: string
  active: boolean
  /** The lectures this professor teaches, as the backend records them. */
  readonly lectureIds: readonly string[]
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
  professorIds?: readonly string[]
}

/**
 * Partial edit of a professor. `lectureIds` replaces the assignment wholesale — pass `[]` to
 * detach the professor from every lecture.
 */
export interface ProfessorUpdate {
  firstName?: string
  lastName?: string
  active?: boolean
  lectureIds?: readonly string[]
}
