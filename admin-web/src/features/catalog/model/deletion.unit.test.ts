import { describe, expect, it } from 'vitest'
import type { Lecture, Professor, Rating } from '@/api/catalog'
import { getCatalogDeletion } from './deletion'

const lecture = {
  id: 'lecture-1',
  code: 'IN0001',
  name: 'Algorithms',
} as Lecture

const professor = {
  id: 'prof-1',
  firstName: 'Ada',
  lastName: 'Lovelace',
} as Professor

const rating = { id: 'rating-1', authorName: 'Bob Smith' } as Rating

describe('catalogue deletion copy', () => {
  it('warns that deleting a lecture takes its content with it', () => {
    const copy = getCatalogDeletion({ type: 'lecture', record: lecture })

    expect(copy.title).toBe('Delete lecture')
    expect(copy.description).toContain('IN0001 — Algorithms')
    expect(copy.description).toContain('comments, answers and ratings go with it')
  })

  it('says a professor deletion drops only the assignment', () => {
    const copy = getCatalogDeletion({ type: 'professor', record: professor })

    expect(copy.title).toBe('Delete professor')
    expect(copy.description).toContain('Ada Lovelace')
    // The lectures survive; saying otherwise would describe a much larger deletion.
    expect(copy.description).toContain('The lectures stay')
  })

  it('names the author whose rating is about to be removed', () => {
    const copy = getCatalogDeletion({ type: 'rating', record: rating })

    expect(copy.title).toBe('Delete rating')
    expect(copy.description).toContain('Bob Smith')
    expect(copy.confirmLabel).toBe('Delete rating')
  })
})
