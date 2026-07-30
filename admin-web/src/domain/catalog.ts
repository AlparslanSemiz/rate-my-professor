export const SEMESTER_SEASONS = ['SUMMER', 'WINTER'] as const
export type SemesterSeason = (typeof SEMESTER_SEASONS)[number]
const semesterSeasonValues: ReadonlySet<string> = new Set(SEMESTER_SEASONS)

/**
 * Decides which rating categories a lecture offers, so changing it changes what future
 * ratings can score. Ratings already submitted keep the categories they were given.
 */
export const LECTURE_TYPES = ['LECTURE_ONLY', 'LECTURE_AND_EXERCISE'] as const
export type LectureType = (typeof LECTURE_TYPES)[number]
const lectureTypeValues: ReadonlySet<string> = new Set(LECTURE_TYPES)

export function isSemesterSeason(value: string | null): value is SemesterSeason {
  return value !== null && semesterSeasonValues.has(value)
}

export function isLectureType(value: string | null): value is LectureType {
  return value !== null && lectureTypeValues.has(value)
}

/** Renders a lecture's term the way the catalogue reads it, e.g. "Winter 2026". */
export function semesterLabel(season: SemesterSeason, year: number): string {
  return `${season === 'WINTER' ? 'Winter' : 'Summer'} ${year}`
}
