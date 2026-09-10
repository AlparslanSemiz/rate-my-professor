import { describe, expect, it, vi } from 'vitest'
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

function deleters() {
  return { lecture: vi.fn(), professor: vi.fn(), rating: vi.fn() }
}

describe('catalogue deletion copy', () => {
  it('warns that deleting a lecture takes its content with it', () => {
    const copy = getCatalogDeletion({ type: 'lecture', record: lecture }, deleters())

    expect(copy.title).toBe('Delete lecture')
    expect(copy.description).toContain('IN0001 - Algorithms')
    expect(copy.description).toContain('comments, answers and ratings go with it')
  })

  it('says a professor deletion drops only the assignment', () => {
    const copy = getCatalogDeletion({ type: 'professor', record: professor }, deleters())

    expect(copy.title).toBe('Delete professor')
    expect(copy.description).toContain('Ada Lovelace')
    // The lectures survive; saying otherwise would describe a much larger deletion.
    expect(copy.description).toContain('The lectures stay')
  })

  it('names the author whose rating is about to be removed', () => {
    const copy = getCatalogDeletion({ type: 'rating', record: rating }, deleters())

    expect(copy.title).toBe('Delete rating')
    expect(copy.description).toContain('Bob Smith')
    expect(copy.confirmLabel).toBe('Delete rating')
  })
})

describe('catalogue deletion dispatch', () => {
  it.each([
    ['lecture', { type: 'lecture', record: lecture } as const, 'lecture-1'],
    ['professor', { type: 'professor', record: professor } as const, 'prof-1'],
    ['rating', { type: 'rating', record: rating } as const, 'rating-1'],
  ])('binds the %s wording to the %s deleter', async (kind, deletion, id) => {
    const calls = deleters()

    await getCatalogDeletion(deletion, calls).remove()

    // The wording and the call are chosen together. They used to be chosen twice, over the
    // same discriminant, in two files — and only one of the two was exhaustive.
    expect(calls[kind as keyof typeof calls]).toHaveBeenCalledWith(id)
    for (const [name, call] of Object.entries(calls)) {
      if (name !== kind) expect(call).not.toHaveBeenCalled()
    }
  })
})
