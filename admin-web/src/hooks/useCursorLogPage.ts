import { useEffect, useState } from 'react'

export interface CursorLogPage<TItem> {
  items: TItem[]
  nextCursor: string | null
}

export interface CursorLogPageOptions<TItem, TMeta, TDraft, TFilters> {
  fetchMeta: () => Promise<TMeta>
  fetchPage: (filters: TFilters, cursor?: string | null) => Promise<CursorLogPage<TItem>>
  toFilters: (draft: TDraft) => TFilters
  /** Returns a message when the draft cannot be applied, or an empty string when it is valid. */
  validateDraft: (draft: TDraft) => string
  getErrorMessage: (error: unknown, fallback: string) => string
  emptyMeta: TMeta
  emptyDraft: TDraft
  /** The unfiltered query used for the first page and after clearing the form. */
  emptyFilters: TFilters
  initialErrorFallback: string
  filterErrorFallback: string
  loadMoreErrorFallback: string
}

/**
 * Shared state machine for the cursor-paginated log screens (admin audit events and
 * application activity). Every callback is expected to be defined at module scope so the
 * initial load runs once, the same way `useAsyncData` is used elsewhere.
 */
export function useCursorLogPage<TItem, TMeta, TDraft, TFilters>({
  fetchMeta,
  fetchPage,
  toFilters,
  validateDraft,
  getErrorMessage,
  emptyMeta,
  emptyDraft,
  emptyFilters,
  initialErrorFallback,
  filterErrorFallback,
  loadMoreErrorFallback,
}: CursorLogPageOptions<TItem, TMeta, TDraft, TFilters>) {
  const [items, setItems] = useState<TItem[]>([])
  const [meta, setMeta] = useState<TMeta>(emptyMeta)
  const [draft, setDraft] = useState<TDraft>(emptyDraft)
  const [activeFilters, setActiveFilters] = useState<TFilters>(emptyFilters)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [initialError, setInitialError] = useState('')
  const [tableError, setTableError] = useState('')

  useEffect(() => {
    let cancelled = false

    Promise.all([fetchMeta(), fetchPage(emptyFilters)])
      .then(([nextMeta, page]) => {
        if (cancelled) return
        setMeta(nextMeta)
        setItems(page.items)
        setNextCursor(page.nextCursor)
        setActiveFilters(emptyFilters)
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setInitialError(getErrorMessage(loadError, initialErrorFallback))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [emptyFilters, fetchMeta, fetchPage, getErrorMessage, initialErrorFallback])

  async function retryInitialLoad() {
    setLoading(true)
    setInitialError('')
    try {
      const [nextMeta, page] = await Promise.all([fetchMeta(), fetchPage(emptyFilters)])
      setMeta(nextMeta)
      setItems(page.items)
      setNextCursor(page.nextCursor)
      setActiveFilters(emptyFilters)
    } catch (loadError: unknown) {
      setInitialError(getErrorMessage(loadError, initialErrorFallback))
    } finally {
      setLoading(false)
    }
  }

  async function applyFilters(nextDraft: TDraft) {
    const validationError = validateDraft(nextDraft)
    if (validationError) {
      setTableError(validationError)
      return
    }

    const filters = toFilters(nextDraft)
    setLoading(true)
    setTableError('')
    try {
      const page = await fetchPage(filters)
      setItems(page.items)
      setNextCursor(page.nextCursor)
      setActiveFilters(filters)
    } catch (loadError: unknown) {
      setTableError(getErrorMessage(loadError, filterErrorFallback))
    } finally {
      setLoading(false)
    }
  }

  function clearFilters() {
    setDraft(emptyDraft)
    void applyFilters(emptyDraft)
  }

  async function loadMore() {
    if (!nextCursor || loadingMore) return

    setLoadingMore(true)
    setTableError('')
    try {
      const page = await fetchPage(activeFilters, nextCursor)
      setItems((current) => [...current, ...page.items])
      setNextCursor(page.nextCursor)
    } catch (loadError: unknown) {
      setTableError(getErrorMessage(loadError, loadMoreErrorFallback))
    } finally {
      setLoadingMore(false)
    }
  }

  return {
    items,
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
