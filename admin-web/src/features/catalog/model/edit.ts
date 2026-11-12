import type {
  Lecture,
  LectureUpdate,
  Professor,
  ProfessorUpdate,
} from '@/api/catalog'
import type { LectureType, SemesterSeason } from '@/domain/catalog'
import { sameIdSet } from '@/utils/collection'

/** The lecture edit form's working copy. */
export interface LectureEditDraft {
  name: string
  code: string
  semesterYear: number
  semesterSeason: SemesterSeason
  active: boolean
  lectureType: LectureType
  professorIds: string[]
}

/** The professor edit form's working copy. */
export interface ProfessorEditDraft {
  firstName: string
  lastName: string
  active: boolean
  lectureIds: string[]
}

/**
 * @param lecture the lecture to edit
 * @returns the draft the form works on, with the assignment flattened to ids
 */
export function createLectureEditDraft(lecture: Lecture): LectureEditDraft {
  return {
    name: lecture.name,
    code: lecture.code,
    semesterYear: lecture.semesterYear,
    semesterSeason: lecture.semesterSeason,
    active: lecture.active,
    lectureType: lecture.lectureType,
    professorIds: lecture.professors.map((professor) => professor.id),
  }
}

/**
 * @param professor the professor to edit
 * @param assignedLectureIds their lectures, built by the caller from the lecture list — the
 *        professor read does not report the assignment
 * @returns the draft the form works on
 */
export function createProfessorEditDraft(
  professor: Professor,
  assignedLectureIds: readonly string[],
): ProfessorEditDraft {
  return {
    firstName: professor.firstName,
    lastName: professor.lastName,
    active: professor.active,
    // Copied, not aliased. The draft is the form's to edit; the list it was built from
    // belongs to the catalogue query's cache, and handing the same array to both would let
    // an edit in progress reach into cached data nothing has re-read.
    lectureIds: [...assignedLectureIds],
  }
}

/**
 * The fields that actually changed.
 *
 * The assignment is compared as a *set*: reordering it is not an edit, and sending it back
 * unchanged would write an audit entry saying the lecture was edited when it was not.
 *
 * @param lecture the lecture as it stands
 * @param draft the form's working copy
 * @returns only the changed fields; possibly empty, which the caller must not send
 */
export function buildLectureUpdate(lecture: Lecture, draft: LectureEditDraft): LectureUpdate {
  const trimmedName = draft.name.trim()
  const trimmedCode = draft.code.trim()
  const update: LectureUpdate = {}
  const currentProfessorIds = lecture.professors.map((professor) => professor.id)

  if (trimmedName !== lecture.name) update.name = trimmedName
  if (trimmedCode !== lecture.code) update.code = trimmedCode
  if (draft.semesterYear !== lecture.semesterYear) update.semesterYear = draft.semesterYear
  if (draft.semesterSeason !== lecture.semesterSeason) update.semesterSeason = draft.semesterSeason
  if (draft.active !== lecture.active) update.active = draft.active
  if (draft.lectureType !== lecture.lectureType) update.lectureType = draft.lectureType
  if (!sameIdSet(draft.professorIds, currentProfessorIds)) update.professorIds = draft.professorIds

  return update
}

/**
 * The fields that actually changed, with the assignment compared as a set.
 *
 * @param professor the professor as they stand
 * @param assignedLectureIds their current lectures, for the comparison
 * @param draft the form's working copy
 * @returns only the changed fields; possibly empty
 */
export function buildProfessorUpdate(
  professor: Professor,
  assignedLectureIds: readonly string[],
  draft: ProfessorEditDraft,
): ProfessorUpdate {
  const trimmedFirstName = draft.firstName.trim()
  const trimmedLastName = draft.lastName.trim()
  const update: ProfessorUpdate = {}

  if (trimmedFirstName !== professor.firstName) update.firstName = trimmedFirstName
  if (trimmedLastName !== professor.lastName) update.lastName = trimmedLastName
  if (draft.active !== professor.active) update.active = draft.active
  if (!sameIdSet(draft.lectureIds, assignedLectureIds)) update.lectureIds = draft.lectureIds

  return update
}

/** @returns whether Save should be offered: something changed, and name and code are set. */
export function canSaveLectureEdit(lecture: Lecture, draft: LectureEditDraft) {
  return (
    draft.name.trim().length > 0 &&
    draft.code.trim().length > 0 &&
    draft.semesterYear > 0 &&
    Object.keys(buildLectureUpdate(lecture, draft)).length > 0
  )
}

/** @returns whether Save should be offered: something changed, and both names are set. */
export function canSaveProfessorEdit(
  professor: Professor,
  assignedLectureIds: readonly string[],
  draft: ProfessorEditDraft,
) {
  return (
    draft.firstName.trim().length > 0 &&
    draft.lastName.trim().length > 0 &&
    Object.keys(buildProfessorUpdate(professor, assignedLectureIds, draft)).length > 0
  )
}
