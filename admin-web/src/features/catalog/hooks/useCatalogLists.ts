import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { catalogService, type Lecture, type Professor } from '@/api/catalog'
import { useSearch } from '@/hooks/useSearch'
import { getErrorMessage } from '@/utils/getErrorMessage'
import {
  matchesActivity,
  matchesLectureQuery,
  matchesProfessorQuery,
  type ActivityFilter,
} from '../model'
import { catalogKeys } from './catalogKeys'

const EMPTY_LECTURES: Lecture[] = []
const EMPTY_PROFESSORS: Professor[] = []

/**
 * Both halves of the catalogue, the search over each, and which of the two states each shows.
 *
 * They are two queries rather than one because they are two endpoints, but they are read
 * together and invalidated together: a lecture edit reassigns professors and a professor edit
 * reassigns lectures, so either write can change what the other tab shows.
 *
 * **The reads return inactive rows too, and the filter is what hides them.** That is the shape
 * `F-006` needed: while the panel called the active-only endpoints, a row switched off was
 * gone from the only list there was and the `PATCH` that would switch it back on had no id to
 * aim at. Defaulting to Active keeps the screen looking as it did.
 */
export function useCatalogLists() {
  const lectures = useQuery({
    queryKey: catalogKeys.lectures(),
    queryFn: () => catalogService.getLectures(),
  })
  const professors = useQuery({
    queryKey: catalogKeys.professors(),
    queryFn: () => catalogService.getProfessors(),
  })

  const lectureItems = lectures.data ?? EMPTY_LECTURES
  const professorItems = professors.data ?? EMPTY_PROFESSORS

  const [lectureActivity, setLectureActivity] = useState<ActivityFilter>('Active')
  const [professorActivity, setProfessorActivity] = useState<ActivityFilter>('Active')

  // Narrowed before the search rather than after, so the search box reports how many of the
  // rows *on screen* match rather than how many exist in a state nobody asked to see.
  const lecturesInState = useMemo(
    () => lectureItems.filter((lecture) => matchesActivity(lecture, lectureActivity)),
    [lectureItems, lectureActivity],
  )
  const professorsInState = useMemo(
    () => professorItems.filter((professor) => matchesActivity(professor, professorActivity)),
    [professorItems, professorActivity],
  )

  const lectureSearch = useSearch(lecturesInState, matchesLectureQuery)
  const professorSearch = useSearch(professorsInState, matchesProfessorQuery)

  const failure = lectures.error ?? professors.error

  return {
    lectures: lectureItems,
    professors: professorItems,
    /**
     * The rows the activity filter admits, before the search narrows them further.
     *
     * This is what the tab strip counts, so the number on the tab and the number of rows
     * under it agree. The unfiltered `lectures` and `professors` above stay the catalogue's
     * own totals, which is what the stat cards and each panel's `n of m` denominator read.
     */
    lecturesInState,
    professorsInState,
    filteredLectures: lectureSearch.filtered,
    filteredProfessors: professorSearch.filtered,
    lectureSearch: lectureSearch.search,
    setLectureSearch: lectureSearch.setSearch,
    professorSearch: professorSearch.search,
    setProfessorSearch: professorSearch.setSearch,
    lectureActivity,
    setLectureActivity,
    professorActivity,
    setProfessorActivity,
    loading: lectures.isPending || professors.isPending,
    loadError: failure
      ? getErrorMessage(
          failure,
          lectures.error ? 'Failed to load lectures' : 'Failed to load professors',
        )
      : '',
    retry: () => {
      void lectures.refetch()
      void professors.refetch()
    },
  }
}
