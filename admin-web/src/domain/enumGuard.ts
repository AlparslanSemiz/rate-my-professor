/**
 * Builds the "is this one of ours?" check for a backend enum.
 *
 * Six of these were written out by hand — a `Set` built from the values, then a predicate
 * closing over it — once per enum, differing only in the noun. This is that, once. The
 * `const` type parameter keeps the literal union, so `isReportStatus` still narrows to
 * `ReportStatus` rather than to `string`.
 */
export function enumGuard<const TValues extends readonly string[]>(values: TValues) {
  const known: ReadonlySet<string> = new Set(values)
  return (value: string | null): value is TValues[number] =>
    value !== null && known.has(value)
}
