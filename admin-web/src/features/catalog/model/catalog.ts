import type { Lecture, Professor } from '@/api/catalog'
import { semesterLabel } from '@/domain/catalog'
import { EMPTY_VALUE } from '@/utils/emptyValue'

/** @returns the professor as the catalogue names them, first name then last. */
export function professorName(professor: { firstName: string; lastName: string }) {
  return `${professor.firstName} ${professor.lastName}`.trim()
}

/** @returns the lecture as the catalogue names it: its code and its title. */
export function lectureLabel(lecture: Lecture) {
  return `${lecture.code} - ${lecture.name}`
}

/** @returns the term the lecture runs in, e.g. "Winter 2026". */
export function lectureTerm(lecture: Lecture) {
  return semesterLabel(lecture.semesterSeason, lecture.semesterYear)
}

/**
 * Which lectures a professor teaches. The professor endpoint does not report the assignment,
 * but the lecture endpoint lists each lecture's professors, so the reverse index is built from
 * the lectures the panel already loaded.
 */
export function matchesLectureQuery(lecture: Lecture, query: string) {
  return (
    lecture.name.toLowerCase().includes(query) ||
    lecture.code.toLowerCase().includes(query) ||
    lecture.professors.some((professor) => professorName(professor).toLowerCase().includes(query))
  )
}

/**
 * @param professor the row to test
 * @param query the search text, already trimmed and lower-cased
 * @returns whether either name matches
 */
export function matchesProfessorQuery(professor: Professor, query: string) {
  return professorName(professor).toLowerCase().includes(query)
}

/**
 * A professor nobody has rated comes back as `0`, not `null`, so keying the dash off the
 * value alone renders "0.0" — which reads as a terrible rating rather than as no data.
 * `ratingCount` is what actually distinguishes the two.
 */
export function formatAverageRating(value: number | null, ratingCount: number): string {
  if (value === null || ratingCount === 0) return EMPTY_VALUE
  return value.toFixed(1)
}

/**
 * The years the semester field will accept.
 *
 * A four-digit range rather than a plausible one: the catalogue holds historical lectures, and
 * a hard upper bound that a maintainer has to revisit is worse than one that is obviously
 * generous. `clampBehavior="strict"` on the input is what these actually enforce.
 */
export const SEMESTER_YEAR_RANGE = { min: 1900, max: 2999 } as const

/**
 * The "no filter" option, spelled the way the moderation filters spell it.
 *
 * A value rather than `null` because a Mantine `Select` shows its placeholder for an empty
 * value, and "All" has to read as a deliberate choice in the box.
 */
export const ALL_ACTIVITY = 'All'

/** Whether a catalogue row is in service, or no filter at all. */
export type ActivityFilter = typeof ALL_ACTIVITY | 'Active' | 'Inactive'

/**
 * The three states, "All" first, in the order the operator reads them.
 *
 * Not derived from an enum because there is none: `active` is a boolean on the wire, and the
 * two labels beside it are the same two words the Status badge already draws.
 */
export const activityFilterOptions = [
  { value: ALL_ACTIVITY, label: ALL_ACTIVITY },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
]

/**
 * @param value whatever the dropdown reported, including `null` when it was cleared
 * @returns the value if it is one this panel knows, otherwise no filter
 */
export function toActivityFilter(value: string | null): ActivityFilter {
  return value === 'Active' || value === 'Inactive' ? value : ALL_ACTIVITY
}

/**
 * @param record anything the catalogue lists; both lectures and professors carry `active`
 * @param filter the state the operator asked for
 * @returns whether the record belongs in the list under that filter
 */
export function matchesActivity(record: { active: boolean }, filter: ActivityFilter): boolean {
  if (filter === ALL_ACTIVITY) return true
  return record.active === (filter === 'Active')
}

