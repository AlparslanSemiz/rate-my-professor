/**
 * The page-size vocabulary shared by every cursor-paged list — users, ratings and the audit
 * log (see `docs/adr/0006-cursor-pagination.md`).
 *
 * The size was decided three times, once per feature, and the constraint that justifies it —
 * the backend accepts 1–100 — was written down beside only one of them. Whoever changed
 * another would have had no way to know the ceiling existed.
 */

/** The largest page the backend will serve. Asking for more is answered with a `400`. */
export const MAX_PAGE_SIZE = 100

/**
 * What the panel asks for: half the ceiling, so a list fills a tall screen in one read while
 * a mutation that re-reads its page moves fifty rows rather than a hundred.
 */
export const DEFAULT_PAGE_SIZE = 50
