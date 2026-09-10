import { HttpResponse, delay, http, type HttpHandler } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  ApiError,
  BadRequestError,
  ConflictError,
  ContractError,
  ForbiddenError,
  NetworkError,
  NotFoundError,
  RateLimitedError,
  RefusedError,
  ResponseError,
  UnauthorizedError,
  apiClient,
} from '@/api/client'
import { systemStatusService } from '@/api/system'
import { API_ENDPOINTS } from '@/test/msw/apiCalls'
import { apiUrl } from '@/test/msw/apiUrl'
import { seedDb } from '@/test/msw/db'
import { server, startMockBackend } from '@/test/msw/server'
import { sweepFixture } from '@/test/msw/sweepFixture'

/**
 * What the panel does when the backend misbehaves — asked once per endpoint, at the service
 * layer.
 *
 * Deliberately **not** asked once per screen. Every one of these answers is produced by
 * `ApiResponseParser`, which is the only place in the panel that reads a status, so asking a
 * `503` of eight different screens is the same answer eight times over — at the cost of eight
 * page renders each. What a screen *does* with the answer is a different question and belongs
 * to `degradedPayloads.integration.test.tsx`, which is where the payload actually reaches a
 * component and can take it down.
 *
 * The endpoint list is `API_ENDPOINTS`, the same data the call-surface sweep reads, so an
 * endpoint added there is asked these questions without anyone remembering to add it here.
 *
 * **The load-bearing assertion is the last one in each case: an `ApiError`, never a
 * `TypeError`.** `getErrorMessage` hides `TypeError`, `RangeError` and friends behind a
 * fallback on purpose, so an internal error escaping a service is not a message on screen —
 * it is the `ErrorBoundary`, which is to say a blank page.
 */
startMockBackend()

/** Long enough that a request with any timeout at all would have given up. */
const WAIT_MS = 500

const METHODS: Record<string, (path: string, resolver: () => Response) => HttpHandler> = {
  GET: (path, resolver) => http.get(apiUrl(path), resolver),
  POST: (path, resolver) => http.post(apiUrl(path), resolver),
  PATCH: (path, resolver) => http.patch(apiUrl(path), resolver),
  DELETE: (path, resolver) => http.delete(apiUrl(path), resolver),
}

/** The envelope the backend puts on a failure, so the parser reads a real body rather than none. */
function envelope(status: number, message: string, reason?: string): Response {
  return HttpResponse.json({ success: false, message, ...(reason ? { reason } : {}) }, { status })
}

/**
 * One way a request can fail, and the type the panel is supposed to raise for it.
 *
 * `transient` is asserted alongside the class because it is the value the retry policy reads
 * (ADR 0001) and the session notice branches on (ADR 0013) — getting the class right and the
 * flag wrong would retry a refusal or stay silent about a broken deployment.
 */
const FAILURES = [
  { name: '400', respond: () => envelope(400, 'Invalid user status'), error: BadRequestError, transient: false },
  { name: '401', respond: () => envelope(401, 'Token is no longer valid'), error: UnauthorizedError, transient: false },
  { name: '403', respond: () => envelope(403, 'Not permitted'), error: ForbiddenError, transient: false },
  { name: '404', respond: () => envelope(404, 'No such record'), error: NotFoundError, transient: false },
  { name: '409', respond: () => envelope(409, 'Refused', 'VALUE_CHANGED'), error: ConflictError, transient: false },
  // 405 and 415 have no row in `apiErrors`' table on purpose — they are protocol failures the
  // panel cannot act on differently — so they arrive as the base `ResponseError`. Asserting
  // that is the point: `docs/consumer-findings.md` C-03 asked whether they are distinguishable,
  // and the answer is that they are not, which is recorded rather than fixed.
  { name: '415', respond: () => envelope(415, 'Content-Type is required'), error: ResponseError, transient: false },
  { name: '429', respond: () => envelope(429, 'Too many requests'), error: RateLimitedError, transient: false },
  { name: '500', respond: () => envelope(500, 'Something broke'), error: ResponseError, transient: true },
  { name: '503', respond: () => envelope(503, 'Unavailable'), error: ResponseError, transient: true },
  // A rejected origin and an unreachable host are the same `TypeError` to `fetch`, so they are
  // one type — and a transient one, which is what keeps a blip from ending the session.
  { name: 'a network error', respond: () => HttpResponse.error(), error: NetworkError, transient: true },
  { name: 'a 2xx with an empty body', respond: () => new HttpResponse('', { status: 200 }), error: ContractError, transient: false },
  {
    name: 'a 2xx that is not JSON',
    respond: () => new HttpResponse('<!doctype html><title>Gateway</title>', { status: 200, headers: { 'Content-Type': 'text/html' } }),
    error: ContractError,
    transient: false,
  },
  // The refusal the backend serves as a 2xx. Not transient even at 200: repeating a refusal
  // gets refused again.
  { name: 'a 2xx that reports success: false', respond: () => HttpResponse.json({ success: false, message: 'Refused' }), error: RefusedError, transient: false },
] as const

/** Every endpoint crossed with every failure, as the flat list `it.each` wants. */
const CASES = API_ENDPOINTS.flatMap((endpoint) =>
  FAILURES.map((failure) => ({
    label: `${endpoint.method} ${endpoint.path} answering ${failure.name}`,
    endpoint,
    failure,
  })),
)

describe('a backend that misbehaves', () => {
  beforeEach(() => {
    apiClient.setToken('shapes-token')
    seedDb(sweepFixture())
  })

  it.each(CASES)('$label', async ({ endpoint, failure }) => {
    server.use(METHODS[endpoint.method](endpoint.path, failure.respond))

    const raised: unknown = await endpoint.send().then(
      () => null,
      (error: unknown) => error,
    )

    // Named first, because a failure here says which assertion below is meaningless.
    expect(raised).toBeInstanceOf(ApiError)
    expect(raised).toBeInstanceOf(failure.error)
    expect((raised as ApiError).transient).toBe(failure.transient)
    // The message is the backend's own sentence or the panel's fallback — never empty, because
    // an empty message renders an alert with no text in it.
    expect((raised as ApiError).message.trim()).not.toBe('')
  })
})

/**
 * `204 No Content` is the one answer that is not a failure, and it is the one most likely to
 * reach a service as `undefined`.
 *
 * The parser returns `undefined` for it, and what happens next is the service's own business:
 * a write is finished, while a read that goes on to touch `response.something` is one property
 * access away from a `TypeError`. Asked of every endpoint because which services do that is
 * exactly what nobody had written down.
 *
 * **Four of them do — `F-026`, measured and deliberately not fixed.** The list below is a pin,
 * not a maintained inventory: a fifth unguarded read turns the first assertion red, and fixing
 * one of these four turns the second red, so either direction has to be looked at. That is the
 * same shape as the two `F-022` tests, which record a crash rather than assert a fix.
 */
const UNGUARDED_ON_204 = new Set([
  // `TokenLoginService.login` reads `response.authToken` to check the login carried a token.
  'POST /auth/login',
  // `AuthSessionService.me` reads `response.user` to map it onto the panel's own shape.
  'GET /auth/me',
  // `UserAccountsService.getById` hands the body to `withRequiredAdminRole`, which reads
  // `subject.email`. Note the asymmetry with `list`, three methods above it in the same class:
  // that one goes through `expectArray`, which guards with `?.[key]` and raises a `ContractError`.
  'GET /users/user-1',
  // `SystemStatusService.getStatus` hands the body to `toSystemStatus`, which reads
  // `response.status`.
  'GET /system/status',
])

describe('a 204 with no body at all', () => {
  beforeEach(() => {
    apiClient.setToken('shapes-token')
    seedDb(sweepFixture())
  })

  it.each(API_ENDPOINTS)('$method $path: what it does with an empty answer', async ({ method, path, send }) => {
    server.use(METHODS[method](path, () => new HttpResponse(null, { status: 204 })))

    const raised: unknown = await send().then(
      () => null,
      (error: unknown) => error,
    )

    if (UNGUARDED_ON_204.has(`${method} ${path}`)) {
      // Recorded, not fixed. A `TypeError` is not a message: `getErrorMessage` replaces the
      // internal error types with a fallback on purpose, so the operator is told something
      // generic about a failure the panel could have named.
      expect(raised).toBeInstanceOf(TypeError)
      return
    }

    // Everything else either accepts an empty answer or says so as an `ApiError`. The
    // thirty-eight that reach here are the negative result this layer exists to produce.
    if (raised !== null) expect(raised).toBeInstanceOf(ApiError)
  })
})

/**
 * A backend that accepts the request and never answers.
 *
 * Distinct from every case above, which all *arrive*. This one measures how long the panel is
 * prepared to wait, and the answer is that there is no limit anywhere: `ApiClient.fetchResponse`
 * calls `fetch` with no `AbortSignal`, `fetch` has no default timeout, and TanStack Query adds
 * none. A hung backend therefore leaves the request pending for as long as the tab is open.
 *
 * Measured rather than read off the source, because "there is no timeout" is exactly the kind
 * of claim that is true until somebody adds one somewhere and nothing says so.
 */
describe('a backend that never answers', () => {
  beforeEach(() => {
    apiClient.setToken('shapes-token')
    seedDb(sweepFixture())
  })

  it('is waited on indefinitely: there is no timeout anywhere in the client', async () => {
    server.use(http.get(apiUrl('/system/status'), () => delay('infinite') as Promise<never>))

    // Parked deliberately. Nothing will ever settle it, which is the finding; the `catch` is
    // there so a later teardown cannot turn it into an unhandled rejection.
    let settled = false
    void systemStatusService
      .getStatus()
      .then(
        () => { settled = true },
        () => { settled = true },
      )

    await new Promise((resolve) => setTimeout(resolve, WAIT_MS))

    // `F-027`. Half a second is not the claim — the claim is that no limit exists, and this is
    // the cheapest observation that distinguishes "slow" from "never". What it costs the
    // operator is measured on the screen, in `degradedPayloads.integration.test.tsx`.
    expect(settled).toBe(false)
  })
})
