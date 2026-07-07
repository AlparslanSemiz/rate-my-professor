export function countByValue<T, K extends keyof T>(items: T[], key: K, value: T[K]) {
  return items.filter((item) => item[key] === value).length
}

export function updateById<T extends { id: string }>(items: T[], id: string, update: (item: T) => T) {
  return items.map((item) => (item.id === id ? update(item) : item))
}
