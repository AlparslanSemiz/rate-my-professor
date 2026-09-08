import type { LectureType, SemesterSeason } from '../domain/catalog'

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
  lectureIds: string[]
  averageRating: number | null
  ratingCount: number
}

export interface LectureUpdate {
  name?: string
  code?: string
  semesterYear?: number
  semesterSeason?: SemesterSeason
  active?: boolean
  lectureType?: LectureType
  professorIds?: string[]
}

export interface ProfessorUpdate {
  firstName?: string
  lastName?: string
  active?: boolean
  lectureIds?: string[]
}
