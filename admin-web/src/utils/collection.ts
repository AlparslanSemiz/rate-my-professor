/**
 * @param items the list to count in
 * @param key the field to compare
 * @param value the value to count
 * @returns how many items hold that value
 */
export function countByValue<T, K extends keyof T>(items: readonly T[], key: K, value: T[K]) {
  return items.filter((item) => item[key] === value).length
}

/**
 * Replaces one item by id, leaving the rest as they are.
 *
 * Returns a new list; the input is not touched. That matters because the lists it is used on
 * are pages held in the query cache, and mutating one in place would change what other
 * screens read without any of them re-rendering.
 *
 * @param items the list to update
 * @param id the item to replace
 * @param update produces the replacement from the current item
 * @returns a new list; unchanged in content if no item matched
 */
export function updateById<T extends { id: string }>(
  items: readonly T[],
  id: string,
  update: (item: T) => T,
) {
  return items.map((item) => (item.id === id ? update(item) : item))
}

/** Whether two id lists hold the same ids, so an unchanged assignment is not sent as an edit. */
export function sameIdSet(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false
  const known = new Set(right)
  return left.every((id) => known.has(id))
}

/**
 * @param items the list to index
 * @returns a lookup by id, for the screens that resolve a reference against a list they
 *          already hold rather than asking the backend for it again
 */
export function indexById<T extends { id: string }>(items: readonly T[]): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]))
}
