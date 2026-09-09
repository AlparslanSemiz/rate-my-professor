import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getErrorMessage } from '@/utils/getErrorMessage'
import {
  ALL_FILTERS,
  matchesReportFilters,
  matchesReportQuery,
  type ReasonFilter,
  type StatusFilter,
} from '../model'
import { moderationKeys } from './moderationKeys'
import type { ModerationApi } from './moderationApi'

interface ReportsOptions {
  api: ModerationApi
  resource: string
  errorMessage: string
}

/** The reports raised against the content, with their own search, status and reason filters. */
export function useModerationReports({ api, resource, errorMessage }: ReportsOptions) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(ALL_FILTERS)
  const [reasonFilter, setReasonFilter] = useState<ReasonFilter>(ALL_FILTERS)

  const query = useQuery({
    queryKey: moderationKeys.reports(resource),
    queryFn: () => api.loadReports(),
  })

  const items = useMemo(() => query.data ?? [], [query.data])
  const filtered = useMemo(() => {
    const query_ = search.trim().toLowerCase()
    return items
      .filter((report) => !query_ || matchesReportQuery(report, query_))
      .filter((report) => matchesReportFilters(report, statusFilter, reasonFilter))
  }, [items, search, statusFilter, reasonFilter])

  return {
    items,
    filtered,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    reasonFilter,
    setReasonFilter,
    loading: query.isPending,
    error: query.error ? getErrorMessage(query.error, errorMessage) : '',
    retry: () => {
      void query.refetch()
    },
  }
}
