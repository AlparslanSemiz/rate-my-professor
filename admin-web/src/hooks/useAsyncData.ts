import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { getErrorMessage } from '@/utils/getErrorMessage'

interface AsyncDataResult<T> {
  data: T
  setData: Dispatch<SetStateAction<T>>
  loading: boolean
  error: string
  retry: () => void
}

export function useAsyncData<T>(
  load: () => Promise<T>,
  initialData: T,
  errorFallback: string
): AsyncDataResult<T> {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    load()
      .then((nextData) => {
        if (!cancelled) setData(nextData)
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(getErrorMessage(loadError, errorFallback))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [errorFallback, load, reloadKey])

  const retry = useCallback(() => {
    setLoading(true)
    setError('')
    setReloadKey((key) => key + 1)
  }, [])

  return { data, setData, loading, error, retry }
}
