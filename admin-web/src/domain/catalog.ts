import { enumGuard } from './enumGuard'

/** The two terms KIT runs. A lecture belongs to exactly one, in one year. */
export const SEMESTER_SEASONS = ['SUMMER', 'WINTER'] as const
/** One of {@link SEMESTER_SEASONS}. */
export type SemesterSeason = (typeof SEMESTER_SEASONS)[number]

/**
 * Decides which rating categories a lecture offers, so changing it changes what future
 * ratings can score. Ratings already submitted keep the categories they were given.
 */
export const LECTURE_TYPES = ['LECTURE_ONLY', 'LECTURE_AND_EXERCISE'] as const
/** One of {@link LECTURE_TYPES}. */
export type LectureType = (typeof LECTURE_TYPES)[number]

/** @returns whether the value is a season this panel knows. */
export const isSemesterSeason = enumGuard(SEMESTER_SEASONS)

/** @returns whether the value is a lecture type this panel knows. */
export const isLectureType = enumGuard(LECTURE_TYPES)

/** Renders a lecture's term the way the catalogue reads it, e.g. "Winter 2026". */
export function semesterLabel(season: SemesterSeason, year: number): string {
  return `${season === 'WINTER' ? 'Winter' : 'Summer'} ${year}`
}
