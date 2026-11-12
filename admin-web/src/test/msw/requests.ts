import type { SetupServer } from 'msw/node'

/**
 * What the panel actually sent.
 *
 * This is the whole reason for moving a test off `vi.mock`. A mocked service records that
 * `update('comment-1', …)` was called; it cannot record the path, the method, the query
 * string, the JSON body or the `Authorization` header, because with the service replaced none
 * of them is ever produced. `F-002` — a field the backend had renamed — lived precisely in
 * that gap and passed every test in this repository.
 */
export interface RecordedRequest {
  method: string
  /** Path and query string, without the origin, so assertions do not repeat the base URL. */
  path: string
  /** The parsed JSON body, or `null` for a request that carried none. */
  body: unknown
  /** The `Authorization` header as sent, or `null` when the request went out unauthenticated. */
  authorization: string | null
  /**
   * The `Content-Type` header as sent, or `null` when none was set.
   *
   * `null` is the interesting value. `ApiRequestBuilder` sets the header only when a body is
   * present, and `JSON.stringify(undefined)` is `undefined` — so the panel's five bodyless
   * writes go out with no `Content-Type` at all. Whether the backend accepts that is a
   * contract question `docs/consumer-findings.md` C-03 put to them; recording the header is
   * what lets the answer live in a test instead of in a paragraph.
   */
  contentType: string | null
}

const recorded: RecordedRequest[] = []

/**
 * @param text the raw request body
 * @returns the parsed JSON, the raw text when it was not JSON, or `null` for an empty body
 *
 * A throw here escapes into MSW's `request:start` listener rather than into the test, where it
 * surfaces as an unrelated failure with no useful stack. The recorder's job is to observe.
 */
function parseBody(text: string): unknown {
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

/**
 * Starts recording every request the server sees, and clears the log between tests.
 *
 * @param server the server `useMockBackend` started
 */
export function recordRequests(server: SetupServer): void {
  server.events.on('request:start', async ({ request }) => {
    // Cloned: the handler still has to be able to read the body.
    const clone = request.clone()
    const text = await clone.text()
    recorded.push({
      method: request.method,
      path: new URL(request.url).pathname + new URL(request.url).search,
      body: parseBody(text),
      authorization: request.headers.get('Authorization'),
      contentType: request.headers.get('Content-Type'),
    })
  })
}

/** Forgets everything recorded so far. */
export function clearRequests(): void {
  recorded.length = 0
}

/**
 * @param method the HTTP method, upper case
 * @param path the exact path, without query string
 * @returns every matching request, in the order they were sent
 */
export function requestsTo(method: string, path: string): RecordedRequest[] {
  return recorded.filter(
    (request) => request.method === method && request.path.split('?')[0] === path,
  )
}

/**
 * @param method the HTTP method, upper case
 * @param path the exact path, without query string
 * @returns the only matching request
 * @throws when there was not exactly one, because "the first of several" is rarely what a
 *         test means and silently taking it hides a duplicate request
 */
export function requestTo(method: string, path: string): RecordedRequest {
  const matches = requestsTo(method, path)
  if (matches.length !== 1) {
    throw new Error(
      `Expected exactly one ${method} ${path}, saw ${matches.length}: ${JSON.stringify(matches)}`,
    )
  }
  return matches[0]
}
