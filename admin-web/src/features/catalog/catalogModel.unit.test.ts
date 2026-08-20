import { describe, expect, it } from 'vitest'
import { formatAverageRating, lectureIdsByProfessor } from './catalogModel'
import type { Lecture } from '../../api/CatalogService'

function lecture(id: string, professorIds: string[]): Lecture {
  return {
    id,
    name: `Lecture ${id}`,
    code: id.toUpperCase(),
    semesterYear: 2026,
    semesterSeason: 'WINTER',
    active: true,
    lectureType: 'LECTURE_ONLY',
    professors: professorIds.map((professorId) => ({
      id: professorId,
      firstName: 'First',
      lastName: 'Last',
      active: true,
    })),
    commentCount: 0,
    ratingCount: 0,
  }
}

describe('formatAverageRating', () => {
  it('renders a real average to one decimal', () => {
    expect(formatAverageRating(4.25, 30)).toBe('4.3')
  })

  it('renders a dash when nobody has rated, even though the backend sends 0', () => {
    expect(formatAverageRating(0, 0)).toBe('—')
  })

  it('keeps a genuine zero average when there are ratings behind it', () => {
    expect(formatAverageRating(0, 4)).toBe('0.0')
  })

  it('still handles a null average defensively', () => {
    expect(formatAverageRating(null, 12)).toBe('—')
  })
})

describe('lectureIdsByProfessor', () => {
  it('reverses the lecture-to-professor assignment', () => {
    const index = lectureIdsByProfessor([
      lecture('l1', ['p1', 'p2']),
      lecture('l2', ['p2']),
    ])

    expect(index.get('p1')).toEqual(['l1'])
    expect(index.get('p2')).toEqual(['l1', 'l2'])
    expect(index.get('p3')).toBeUndefined()
  })
})
