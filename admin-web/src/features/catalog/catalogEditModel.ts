import type {
  Lecture,
  LectureUpdate,
  Professor,
  ProfessorUpdate,
} from '../../api/CatalogService'
import type { LectureType, SemesterSeason } from '../../domain/catalog'
import { sameIdSet } from '../../utils/collection'

export interface LectureEditDraft {
  name: string
  code: string
  semesterYear: number
  semesterSeason: SemesterSeason
  active: boolean
  lectureType: LectureType
  professorIds: string[]
}

export interface ProfessorEditDraft {
  firstName: string
  lastName: string
  active: boolean
  lectureIds: string[]
}

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

export function createProfessorEditDraft(
  professor: Professor,
  assignedLectureIds: string[],
): ProfessorEditDraft {
  return {
    firstName: professor.firstName,
    lastName: professor.lastName,
    active: professor.active,
    lectureIds: assignedLectureIds,
  }
}

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

export function buildProfessorUpdate(
  professor: Professor,
  assignedLectureIds: string[],
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

export function canSaveLectureEdit(lecture: Lecture, draft: LectureEditDraft) {
  return (
    draft.name.trim().length > 0 &&
    draft.code.trim().length > 0 &&
    draft.semesterYear > 0 &&
    Object.keys(buildLectureUpdate(lecture, draft)).length > 0
  )
}

export function canSaveProfessorEdit(
  professor: Professor,
  assignedLectureIds: string[],
  draft: ProfessorEditDraft,
) {
  return (
    draft.firstName.trim().length > 0 &&
    draft.lastName.trim().length > 0 &&
    Object.keys(buildProfessorUpdate(professor, assignedLectureIds, draft)).length > 0
  )
}
