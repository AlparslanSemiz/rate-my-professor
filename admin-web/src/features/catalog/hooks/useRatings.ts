import { useCallback, useState } from 'react'
import { ratingsService, type Rating } from '@/api/catalog'
import { useAsyncData } from '@/hooks/useAsyncData'
import { getErrorMessage } from '@/utils/getErrorMessage'

const RATINGS_PAGE_SIZE = 50
const EMPTY_PAGE = { ratings: [] as Rating[], nextCursor: null as string | null }

function loadFirstPage() {
  return ratingsService.list({ limit: RATINGS_PAGE_SIZE })
}

/**
 * The ratings listing: read and delete, never edit. Kept apart from `useCatalog` because it
 * pages on a cursor while the lecture and professor lists arrive whole.
 */
export function useRatings() {
  const page = useAsyncData(loadFirstPage, EMPTY_PAGE, 'Failed to load ratings')
  const [lectureId, setLectureId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  const setPage = page.setData

  const read = useCallback(
    async (nextLectureId: string | null, cursor?: string | null) => {
      setBusy(true)
      setActionError('')
      try {
        const next = await ratingsService.list({
          limit: RATINGS_PAGE_SIZE,
          cursor,
          lectureId: nextLectureId ?? undefined,
        })
        setPage((current) =>
          cursor
            ? { ratings: [...current.ratings, ...next.ratings], nextCursor: next.nextCursor }
            : next,
        )
      } catch (error: unknown) {
        setActionError(getErrorMessage(error, 'The ratings could not be read.'))
      } finally {
        setBusy(false)
      }
    },
    [setPage],
  )

  const filterByLecture = useCallback(
    (nextLectureId: string | null) => {
      setLectureId(nextLectureId)
      void read(nextLectureId)
    },
    [read],
  )

  const loadMore = useCallback(() => {
    if (page.data.nextCursor) void read(lectureId, page.data.nextCursor)
  }, [lectureId, page.data.nextCursor, read])

  /** Re-reads rather than dropping the row locally: the backend decides what is left. */
  const remove = useCallback(
    async (id: string) => {
      setBusy(true)
      setActionError('')
      try {
        await ratingsService.delete(id)
        await read(lectureId)
      } catch (error: unknown) {
        setActionError(getErrorMessage(error, 'The rating could not be deleted.'))
      } finally {
        setBusy(false)
      }
    },
    [lectureId, read],
  )

  return {
    ratings: page.data.ratings,
    nextCursor: page.data.nextCursor,
    lectureId,
    loading: page.loading,
    loadError: page.error,
    retry: page.retry,
    busy,
    actionError,
    filterByLecture,
    loadMore,
    remove,
  }
}
