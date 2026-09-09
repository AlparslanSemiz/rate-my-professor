import { useCallback, useState } from 'react'
import {
  catalogService,
  type Lecture,
  type LectureUpdate,
  type Professor,
  type ProfessorUpdate,
} from '@/api/catalog'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useSearch } from '@/hooks/useSearch'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { matchesLectureQuery, matchesProfessorQuery } from '../catalogModel'

const EMPTY_LECTURES: Lecture[] = []
const EMPTY_PROFESSORS: Professor[] = []

const loadLectures = () => catalogService.getLectures()
const loadProfessors = () => catalogService.getProfessors()

/**
 * Both halves of the catalogue are kept loaded together: a lecture edit reassigns professors
 * and a professor edit reassigns lectures, so either write can change what the other tab shows.
 */
export function useCatalog() {
  const lectures = useAsyncData(loadLectures, EMPTY_LECTURES, 'Failed to load lectures')
  const professors = useAsyncData(loadProfessors, EMPTY_PROFESSORS, 'Failed to load professors')
  const [mutating, setMutating] = useState(false)
  const [actionError, setActionError] = useState('')

  const lectureSearch = useSearch(lectures.data, matchesLectureQuery)
  const professorSearch = useSearch(professors.data, matchesProfessorQuery)

  const setLectures = lectures.setData
  const setProfessors = professors.setData

  const refresh = useCallback(async () => {
    const [nextLectures, nextProfessors] = await Promise.all([loadLectures(), loadProfessors()])
    setLectures(nextLectures)
    setProfessors(nextProfessors)
  }, [setLectures, setProfessors])

  const run = useCallback(
    async (mutate: () => Promise<unknown>, failure: string) => {
      setMutating(true)
      setActionError('')
      try {
        await mutate()
        await refresh()
      } catch (error: unknown) {
        setActionError(getErrorMessage(error, failure))
        throw error
      } finally {
        setMutating(false)
      }
    },
    [refresh],
  )

  return {
    lectures: lectures.data,
    professors: professors.data,
    filteredLectures: lectureSearch.filtered,
    filteredProfessors: professorSearch.filtered,
    lectureSearch: lectureSearch.search,
    setLectureSearch: lectureSearch.setSearch,
    professorSearch: professorSearch.search,
    setProfessorSearch: professorSearch.setSearch,
    loading: lectures.loading || professors.loading,
    loadError: lectures.error || professors.error,
    retry: () => {
      lectures.retry()
      professors.retry()
    },
    mutating,
    actionError,
    updateLecture: (id: string, update: LectureUpdate) =>
      run(() => catalogService.updateLecture(id, update), 'The lecture could not be saved.'),
    deleteLecture: (id: string) =>
      run(() => catalogService.deleteLecture(id), 'The lecture could not be deleted.'),
    updateProfessor: (id: string, update: ProfessorUpdate) =>
      run(() => catalogService.updateProfessor(id, update), 'The professor could not be saved.'),
    deleteProfessor: (id: string) =>
      run(() => catalogService.deleteProfessor(id), 'The professor could not be deleted.'),
  }
}
