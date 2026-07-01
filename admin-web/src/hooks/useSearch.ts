import { useMemo, useState } from 'react'

export function useSearch<T>(items: T[], matches: (item: T, query: string) => boolean) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim()
    if (!query) return items
    return items.filter((item) => matches(item, query))
  }, [items, search, matches])

  return { search, setSearch, filtered }
}
