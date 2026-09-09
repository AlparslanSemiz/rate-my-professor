import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { ALL_FILTERS, narrowContent, type ContentStatusFilter } from '../model'
import { moderationKeys } from './moderationKeys'
import type { ModerationApi } from './moderationApi'

interface ContentOptions {
  api: ModerationApi
  resource: string
  errorMessage: string
}

/** The moderated content, and the search and status filter applied to it on screen. */
export function useModerationContent({ api, resource, errorMessage }: ContentOptions) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ContentStatusFilter>(ALL_FILTERS)

  const query = useQuery({
    queryKey: moderationKeys.content(resource),
    queryFn: () => api.loadContent(),
  })

  const items = useMemo(() => query.data ?? [], [query.data])
  const filtered = useMemo(
    () => narrowContent(items, search, statusFilter),
    [items, search, statusFilter],
  )

  return {
    items,
    filtered,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    /**
     * Whether the operator has narrowed the list. The table uses it to expand threads
     * automatically — a search that matched an answer is useless if the answer stays hidden
     * under a collapsed comment.
     */
    narrowed: search.trim() !== '' || statusFilter !== ALL_FILTERS,
    loading: query.isPending,
    error: query.error ? getErrorMessage(query.error, errorMessage) : '',
    retry: () => {
      void query.refetch()
    },
  }
}
