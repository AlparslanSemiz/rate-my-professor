import { useQuery } from '@tanstack/react-query'
import { catalogService, type Lecture, type Professor } from '@/api/catalog'
import { useSearch } from '@/hooks/useSearch'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { matchesLectureQuery, matchesProfessorQuery } from '../model'
import { catalogKeys } from './catalogKeys'

const EMPTY_LECTURES: Lecture[] = []
const EMPTY_PROFESSORS: Professor[] = []

/**
 * Both halves of the catalogue, and the search over each.
 *
 * They are two queries rather than one because they are two endpoints, but they are read
 * together and invalidated together: a lecture edit reassigns professors and a professor edit
 * reassigns lectures, so either write can change what the other tab shows.
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

  const lectureSearch = useSearch(lectureItems, matchesLectureQuery)
  const professorSearch = useSearch(professorItems, matchesProfessorQuery)

  const failure = lectures.error ?? professors.error

  return {
    lectures: lectureItems,
    professors: professorItems,
    filteredLectures: lectureSearch.filtered,
    filteredProfessors: professorSearch.filtered,
    lectureSearch: lectureSearch.search,
    setLectureSearch: lectureSearch.setSearch,
    professorSearch: professorSearch.search,
    setProfessorSearch: professorSearch.setSearch,
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
