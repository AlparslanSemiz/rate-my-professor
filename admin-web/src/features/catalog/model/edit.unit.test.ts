import { describe, expect, it } from 'vitest'
import type { Lecture, Professor } from '@/api/catalog'
import {
  buildLectureUpdate,
  buildProfessorUpdate,
  canSaveLectureEdit,
  canSaveProfessorEdit,
  createLectureEditDraft,
  createProfessorEditDraft,
} from './edit'

const lecture: Lecture = {
  id: 'lecture-1',
  name: 'Algorithms',
  code: 'CS101',
  semesterYear: 2026,
  semesterSeason: 'WINTER',
  active: true,
  lectureType: 'LECTURE_ONLY',
  professors: [
    { id: 'professor-1', firstName: 'Ada', lastName: 'Lovelace', active: true },
    { id: 'professor-2', firstName: 'Alan', lastName: 'Turing', active: true },
  ],
  commentCount: 12,
  ratingCount: 4,
}

const professor: Professor = {
  id: 'professor-1',
  firstName: 'Ada',
  lastName: 'Lovelace',
  active: true,
  lectureIds: ['lecture-1'],
  averageRating: 4.5,
  ratingCount: 8,
}

describe('catalog edit model', () => {
  it('builds a lecture update from only changed fields', () => {
    const draft = {
      ...createLectureEditDraft(lecture),
      name: '  Advanced Algorithms  ',
      semesterSeason: 'SUMMER' as const,
      professorIds: ['professor-2', 'professor-1'],
    }

    expect(buildLectureUpdate(lecture, draft)).toEqual({
      name: 'Advanced Algorithms',
      semesterSeason: 'SUMMER',
    })
  })

  it('includes a changed lecture assignment', () => {
    const draft = { ...createLectureEditDraft(lecture), professorIds: ['professor-1'] }

    expect(buildLectureUpdate(lecture, draft)).toEqual({ professorIds: ['professor-1'] })
  })

  it('requires a valid changed lecture draft before saving', () => {
    expect(canSaveLectureEdit(lecture, createLectureEditDraft(lecture))).toBe(false)
    expect(canSaveLectureEdit(lecture, { ...createLectureEditDraft(lecture), name: '   ' })).toBe(
      false,
    )
    expect(canSaveLectureEdit(lecture, { ...createLectureEditDraft(lecture), active: false })).toBe(
      true,
    )
  })

  it('builds a professor update from only changed fields', () => {
    const assignedLectureIds = ['lecture-1', 'lecture-2']
    const draft = {
      ...createProfessorEditDraft(professor, assignedLectureIds),
      firstName: '  Augusta Ada  ',
      active: false,
    }

    expect(buildProfessorUpdate(professor, assignedLectureIds, draft)).toEqual({
      firstName: 'Augusta Ada',
      active: false,
    })
  })

  it('includes a changed professor assignment', () => {
    const assignedLectureIds = ['lecture-1', 'lecture-2']
    const draft = {
      ...createProfessorEditDraft(professor, assignedLectureIds),
      lectureIds: ['lecture-2'],
    }

    expect(buildProfessorUpdate(professor, assignedLectureIds, draft)).toEqual({
      lectureIds: ['lecture-2'],
    })
  })

  it('requires a valid changed professor draft before saving', () => {
    const assignedLectureIds = ['lecture-1']

    expect(
      canSaveProfessorEdit(
        professor,
        assignedLectureIds,
        createProfessorEditDraft(professor, assignedLectureIds),
      ),
    ).toBe(false)
    expect(
      canSaveProfessorEdit(
        professor,
        assignedLectureIds,
        { ...createProfessorEditDraft(professor, assignedLectureIds), lastName: '   ' },
      ),
    ).toBe(false)
    expect(
      canSaveProfessorEdit(
        professor,
        assignedLectureIds,
        { ...createProfessorEditDraft(professor, assignedLectureIds), active: false },
      ),
    ).toBe(true)
  })
})
