import type { Lecture, Professor } from '@/api/catalog'
import { semesterLabel } from '@/domain/catalog'

export function professorName(professor: { firstName: string; lastName: string }) {
  return `${professor.firstName} ${professor.lastName}`.trim()
}

export function lectureLabel(lecture: Lecture) {
  return `${lecture.code} — ${lecture.name}`
}

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

export function matchesProfessorQuery(professor: Professor, query: string) {
  return professorName(professor).toLowerCase().includes(query)
}

/**
 * A professor nobody has rated comes back as `0`, not `null`, so keying the dash off the
 * value alone renders "0.0" — which reads as a terrible rating rather than as no data.
 * `ratingCount` is what actually distinguishes the two.
 */
export function formatAverageRating(value: number | null, ratingCount: number): string {
  if (value === null || ratingCount === 0) return '—'
  return value.toFixed(1)
}
