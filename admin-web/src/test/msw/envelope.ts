import { HttpResponse } from 'msw'
import { MAX_PAGE_SIZE } from '@/api/client/paging'

/**
 * The `{ success, message, … }` envelope every endpoint in this API answers in, and the
 * refusals it answers with.
 *
 * Handlers build responses through here rather than returning literals, because the envelope
 * is the part a hand-written mock most often gets subtly wrong — and getting it wrong is what
 * makes a test pass against a shape the backend never sends.
 */

const DEFAULT_MESSAGE = 'Success'

/** A 2xx carrying a payload. */
export function ok<T extends object>(payload: T = {} as T, message = DEFAULT_MESSAGE) {
  return HttpResponse.json({ success: true, message, ...payload })
}

/**
 * A `2xx` that declines in the body. The backend does this for refusals it considers served
 * rather than failed, and the panel raises `RefusedError` for it.
 */
export function refused(message: string, reason?: string) {
  return HttpResponse.json({ success: false, message, ...(reason ? { reason } : {}) })
}

/** A failing status with the envelope the backend puts on it. */
export function failure(status: number, message: string, reason?: string, headers?: HeadersInit) {
  return HttpResponse.json(
    { success: false, message, ...(reason ? { reason } : {}) },
    { status, headers },
  )
}

/** What the backend answers when a cursor arrives without the limit that produced it. */
export const CURSOR_WITHOUT_LIMIT_MESSAGE = 'A cursor requires a limit'

export interface Page<T> {
  items: T[]
  nextCursor: string | null
}

/**
 * Slices a list the way the backend's cursor paging does, and refuses the same way.
 *
 * It really slices. A handler that returns the whole list regardless of `limit` lets a test
 * assert that "Load more" appends without anything having been paged, which is how a paging
 * bug survives a green suite.
 *
 * The cursor is the id of the last item on the previous page — opaque to the panel, which is
 * the contract ADR 0006 records, and enough for a test double to resolve.
 *
 * @param items the full list, in the order the backend would serve it
 * @param url the request URL, read for `limit` and `cursor`
 * @param idOf how to read an item's id, which is what the cursor points at
 * @returns the page, or `null` when the request itself was invalid
 */
export function paginate<T>(
  items: readonly T[],
  url: URL,
  idOf: (item: T) => string,
): Page<T> | null {
  const limitParam = url.searchParams.get('limit')
  const cursor = url.searchParams.get('cursor')

  if (cursor && !limitParam) return null

  const limit = limitParam ? Number(limitParam) : items.length
  if (limitParam && (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE)) return null

  const start = cursor ? items.findIndex((item) => idOf(item) === cursor) + 1 : 0
  const slice = items.slice(start, start + limit)
  const last = slice.at(-1)
  const exhausted = start + limit >= items.length

  return { items: slice, nextCursor: !limitParam || exhausted || !last ? null : idOf(last) }
}
