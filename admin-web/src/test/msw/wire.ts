/**
 * Building the degenerate payloads a domain-typed store cannot hold.
 *
 * `db.ts` is typed with the panel's own types, which is what keeps the ordinary fixtures
 * honest — and it means a response *missing* a field the type declares is unrepresentable
 * there. That is exactly the shape worth testing: `changes` absent on an audit entry, `actor`
 * absent, `author` absent. Those are wire concerns, so a test writes the wire.
 */

/**
 * @param value the complete record
 * @param key the field to leave out
 * @returns a copy with `key` absent — not `undefined`, absent, which is what a serializer
 *          that omits an empty field actually sends
 */
export function without<T extends object, K extends keyof T>(value: T, key: K): Omit<T, K> {
  const copy: T = { ...value }
  delete copy[key]
  return copy
}
