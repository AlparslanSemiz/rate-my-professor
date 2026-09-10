import { useState } from 'react'
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { ratingsService } from '@/api/catalog'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { catalogKeys } from './catalogKeys'
import { DEFAULT_PAGE_SIZE } from '@/api/client'


/**
 * The ratings listing: read and delete, never edit. Kept apart from `useCatalog` because it
 * pages on a cursor while the lecture and professor lists arrive whole.
 */
export function useRatings() {
  const queryClient = useQueryClient()
  const [lectureId, setLectureId] = useState<string | null>(null)

  const ratings = useInfiniteQuery({
    queryKey: catalogKeys.ratings(lectureId),
    queryFn: ({ pageParam }) =>
      ratingsService.list({
        limit: DEFAULT_PAGE_SIZE,
        cursor: pageParam,
        lectureId: lectureId ?? undefined,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor,
    // Filtering by lecture is a different query. Without this the rows vanish while it runs,
    // and a refused filter would leave the operator with an empty table.
    placeholderData: keepPreviousData,
  })

  /** Re-reads rather than dropping the row locally: the backend decides what is left. */
  const remove = useMutation({
    mutationFn: (id: string) => ratingsService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: catalogKeys.ratings(lectureId) }),
  })

  const loadError = ratings.error ? getErrorMessage(ratings.error, 'Failed to load ratings') : ''

  return {
    ratings: ratings.data?.pages.flatMap((page) => page.ratings) ?? [],
    hasMore: ratings.hasNextPage,
    lectureId,
    loading: ratings.isPending || (ratings.isFetching && !ratings.isFetchingNextPage),
    loadError,
    actionError: remove.error
      ? getErrorMessage(remove.error, 'The rating could not be deleted.')
      : '',
    busy: ratings.isFetching || remove.isPending,
    filterByLecture: setLectureId,
    loadMore: async () => {
      await ratings.fetchNextPage()
    },
    remove: async (id: string) => {
      await remove.mutateAsync(id)
    },
  }
}
