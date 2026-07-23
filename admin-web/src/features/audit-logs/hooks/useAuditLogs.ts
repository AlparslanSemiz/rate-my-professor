import { useEffect, useState } from 'react'
import {
  auditLogsService,
  type AuditLog,
  type AuditLogFilters,
  type AuditMeta,
} from '../../../api/AuditLogsService'
import {
  EMPTY_AUDIT_META,
  EMPTY_FILTERS,
  getAuditErrorMessage,
  isValidDateRange,
  toAuditFilters,
  type FilterDraft,
} from '../auditLogModel'

async function fetchInitialAuditData() {
  const [meta, page] = await Promise.all([
    auditLogsService.getMeta(),
    auditLogsService.getLogs(),
  ])
  return { meta, page }
}

export function useAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [meta, setMeta] = useState<AuditMeta>(EMPTY_AUDIT_META)
  const [draft, setDraft] = useState<FilterDraft>(EMPTY_FILTERS)
  const [activeFilters, setActiveFilters] = useState<AuditLogFilters>({})
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [initialError, setInitialError] = useState('')
  const [tableError, setTableError] = useState('')

  function applyInitialData({
    meta: nextMeta,
    page,
  }: Awaited<ReturnType<typeof fetchInitialAuditData>>) {
    setMeta(nextMeta)
    setLogs(page.auditLogs)
    setNextCursor(page.nextCursor)
    setActiveFilters({})
  }

  useEffect(() => {
    let cancelled = false

    fetchInitialAuditData()
      .then((result) => {
        if (!cancelled) applyInitialData(result)
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setInitialError(getAuditErrorMessage(loadError, 'Failed to load audit logs'))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  async function retryInitialLoad() {
    setLoading(true)
    setInitialError('')
    try {
      applyInitialData(await fetchInitialAuditData())
    } catch (loadError: unknown) {
      setInitialError(getAuditErrorMessage(loadError, 'Failed to load audit logs'))
    } finally {
      setLoading(false)
    }
  }

  async function applyFilters(nextDraft: FilterDraft) {
    if (!isValidDateRange(nextDraft)) {
      setTableError('The start date must be before or equal to the end date.')
      return
    }

    const filters = toAuditFilters(nextDraft)
    setLoading(true)
    setTableError('')
    try {
      const page = await auditLogsService.getLogs(filters)
      setLogs(page.auditLogs)
      setNextCursor(page.nextCursor)
      setActiveFilters(filters)
    } catch (loadError: unknown) {
      setTableError(getAuditErrorMessage(loadError, 'Failed to apply audit log filters'))
    } finally {
      setLoading(false)
    }
  }

  function clearFilters() {
    setDraft(EMPTY_FILTERS)
    void applyFilters(EMPTY_FILTERS)
  }

  async function loadMore() {
    if (!nextCursor || loadingMore) return

    setLoadingMore(true)
    setTableError('')
    try {
      const page = await auditLogsService.getLogs(activeFilters, nextCursor)
      setLogs((current) => [...current, ...page.auditLogs])
      setNextCursor(page.nextCursor)
    } catch (loadError: unknown) {
      setTableError(getAuditErrorMessage(loadError, 'Failed to load more audit logs'))
    } finally {
      setLoadingMore(false)
    }
  }

  return {
    logs,
    meta,
    draft,
    setDraft,
    nextCursor,
    loading,
    loadingMore,
    initialError,
    tableError,
    retryInitialLoad,
    applyFilters,
    clearFilters,
    loadMore,
  }
}
