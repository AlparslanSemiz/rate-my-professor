import type { Lecture, Professor } from '../../api/CatalogService'
import { semesterLabel } from '../../domain/catalog'

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
export function lectureIdsByProfessor(lectures: Lecture[]): Map<string, string[]> {
  const index = new Map<string, string[]>()
  for (const lecture of lectures) {
    for (const professor of lecture.professors) {
      const assigned = index.get(professor.id)
      if (assigned) assigned.push(lecture.id)
      else index.set(professor.id, [lecture.id])
    }
  }
  return index
}

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

export function formatAverageRating(value: number | null): string {
  return value === null ? '—' : value.toFixed(1)
}
