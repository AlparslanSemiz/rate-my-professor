import { enumGuard } from './enumGuard'

export const SEMESTER_SEASONS = ['SUMMER', 'WINTER'] as const
export type SemesterSeason = (typeof SEMESTER_SEASONS)[number]

/**
 * Decides which rating categories a lecture offers, so changing it changes what future
 * ratings can score. Ratings already submitted keep the categories they were given.
 */
export const LECTURE_TYPES = ['LECTURE_ONLY', 'LECTURE_AND_EXERCISE'] as const
export type LectureType = (typeof LECTURE_TYPES)[number]

export const isSemesterSeason = enumGuard(SEMESTER_SEASONS)

export const isLectureType = enumGuard(LECTURE_TYPES)

/** Renders a lecture's term the way the catalogue reads it, e.g. "Winter 2026". */
export function semesterLabel(season: SemesterSeason, year: number): string {
  return `${season === 'WINTER' ? 'Winter' : 'Summer'} ${year}`
}
