export function countByValue<T, K extends keyof T>(items: T[], key: K, value: T[K]) {
  return items.filter((item) => item[key] === value).length
}

export function updateById<T extends { id: string }>(items: T[], id: string, update: (item: T) => T) {
  return items.map((item) => (item.id === id ? update(item) : item))
}

/** Whether two id lists hold the same ids, so an unchanged assignment is not sent as an edit. */
export function sameIdSet(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false
  const known = new Set(right)
  return left.every((id) => known.has(id))
}

export function indexById<T extends { id: string }>(items: T[]): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]))
}
