import { useMemo, useState } from 'react'

function normalizeSearchQuery(value: string) {
  return value.trim().toLowerCase()
}

/**
 * Client-side search over a list already in memory.
 *
 * For the screens whose data is unpaged — the catalogue, the moderation tables — where
 * filtering locally is immediate and asking the backend would not be. The paged screens
 * (users, ratings, the audit log) send `q` instead, because they only hold one page and
 * filtering it would search fifty rows out of thousands.
 *
 * The query is trimmed and lower-cased once per keystroke, so `matches` receives it ready to
 * compare and does not each normalise it itself.
 *
 * @param items the list to search
 * @param matches decides whether one item matches; must be stable, or the memo is pointless
 * @returns the query, a setter for it, and the narrowed list
 */
export function useSearch<T>(items: T[], matches: (item: T, query: string) => boolean) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const query = normalizeSearchQuery(search)
    if (!query) return items
    return items.filter((item) => matches(item, query))
  }, [items, search, matches])

  return { search, setSearch, filtered }
}
