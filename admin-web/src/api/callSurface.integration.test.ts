import { http } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { activityLogsService, auditLogsService } from '@/api/logs'
import { apiClient } from '@/api/client'
import { commentsService } from '@/api/moderation'
import { feedbackService } from '@/api/feedback'
import { API_CALLS, MODERATED } from '@/test/msw/apiCalls'
import { apiUrl } from '@/test/msw/apiUrl'
import { seedDb } from '@/test/msw/db'
import { ok } from '@/test/msw/envelope'
import { requestTo } from '@/test/msw/requests'
import { server, startMockBackend } from '@/test/msw/server'
import { sweepFixture } from '@/test/msw/sweepFixture'

/**
 * Every request the panel can make, swept in one place.
 *
 * Each service already had its own test before this file existed, and that is exactly the gap
 * it closes: a *new* service method could arrive with no test at all and nothing would notice,
 * because nothing was looking at the surface as a whole. The backend answers the same question
 * by reading its route table out of Spring's mapping registry. The panel has no registry, so
 * the list is read out of the modules themselves.
 *
 * Two things are asserted, and they are different in kind:
 *
 * 1. **Per call** — the path, the verb, the `Authorization` header, whether a `Content-Type`
 *    was set at all, the body, and the query string. This is the part `vi.mock` cannot see:
 *    with the service replaced, none of it is ever produced. `F-002` lived in that gap.
 * 2. **The ratchet** — every method discovered in `src/api/**` is either exercised above or
 *    named in {@link EXEMPT} with a reason. An unclassified method fails the suite, which is
 *    what stops the list rotting the first time somebody adds an endpoint.
 *
 * What this file does **not** establish is whether the backend agrees with any of it. That
 * needs the schema, and `docs/api/openapi.json` is not in this repository — see ADR 0008.
 */
startMockBackend()

/**
 * The base the client prefixes every path with, which is what lands in the recorded URL.
 * Derived rather than written out, so the assertions cannot drift from `.env`.
 */
const BASE = new URL(apiUrl('/'), 'http://localhost').pathname.replace(/\/$/, '')

/** Any value: the sweep asserts what went out, and never what came back. */
const TOKEN = 'sweep-token'

// ---------------------------------------------------------------------------------------
// Discovery — from the modules, not from a list somebody maintains
// ---------------------------------------------------------------------------------------

const apiModules = import.meta.glob<Record<string, unknown>>(
  ['/src/api/**/*.ts', '!/src/api/**/*.test.ts'],
  { eager: true },
)

/**
 * @param value an exported binding that might be a class
 * @returns every method on its prototype chain, own and inherited, excluding the constructor
 *
 * Walks the chain rather than one prototype, because `CommentsService` declares nothing of its
 * own — all six of its methods come from `ModerationService`. Stops before `Object.prototype`
 * and `Error.prototype` so `toString` and friends are not mistaken for API surface. Only
 * `descriptor.value` functions count, so a getter is left alone.
 *
 * A plain exported function has a `prototype` too, and yields an empty list here — which is
 * why mappers such as `toRating` drop out without needing to be named.
 */
function methodsOf(value: unknown): string[] {
  if (typeof value !== 'function') return []
  const names = new Set<string>()
  let proto: object | null = (value as { prototype?: object }).prototype ?? null
  while (proto && proto !== Object.prototype && proto !== Error.prototype) {
    for (const key of Object.getOwnPropertyNames(proto)) {
      if (key === 'constructor') continue
      const descriptor = Object.getOwnPropertyDescriptor(proto, key)
      if (descriptor && typeof descriptor.value === 'function') names.add(key)
    }
    proto = Object.getPrototypeOf(proto) as object | null
  }
  return [...names]
}

/**
 * @returns every `Class.method` in `src/api/**`, sorted and deduplicated
 *
 * Deduplicated because a barrel re-exports the same class object, so `AuthService` is found
 * twice — once at its own module and once at `auth/index.ts`.
 *
 * **Scope, stated rather than implied:** TypeScript's `private` is erased before this runs, so
 * a private method is indistinguishable from a public one here. No service currently has one;
 * the four transport classes do, and they are exempt as whole classes, which is why the
 * distinction has not had to be made.
 */
function discoverServiceMethods(): string[] {
  const found = new Set<string>()
  for (const mod of Object.values(apiModules)) {
    for (const [name, value] of Object.entries(mod)) {
      for (const method of methodsOf(value)) found.add(`${name}.${method}`)
    }
  }
  return [...found].sort()
}

/**
 * Methods that are discovered but deliberately not swept, each with the reason.
 *
 * Keyed by class because that is the honest granularity: these are not endpoints the sweep
 * forgot, they are the machinery every endpoint goes through, and they are covered by
 * `ApiClient.unit.test.ts` and `apiErrors.unit.test.ts` against a stubbed `fetch`.
 *
 * **This list claims no more than it was observed to cover.** The eleven `ApiError` classes are
 * *not* here: they declare no prototype methods, so discovery never returns them and exempting
 * them would be asserting something about a list they are not on.
 */
const EXEMPT: Record<string, string> = {
  ApiClient: 'The transport itself. It has no path of its own: it is what every swept row goes through.',
  ApiSession: 'Holds the token and the 401 listener. No request originates here.',
  ApiRequestBuilder: 'Builds the URL and headers the sweep asserts on. Testing it through itself would prove nothing.',
  ApiResponseParser: 'Reads responses. The sweep is about what went out.',
}



// ---------------------------------------------------------------------------------------
// The sweep
// ---------------------------------------------------------------------------------------

describe('every call the panel can make', () => {
  beforeEach(() => {
    apiClient.setToken(TOKEN)
    seedDb(sweepFixture())
  })

  it.each(API_CALLS)('$name', async ({ method, path, query, body, contentType, send }) => {
    await send()

    const recorded = requestTo(method, `${BASE}${path}`)

    // The full path including the query string, so a parameter that should have been dropped
    // cannot hide behind a partial match.
    expect(recorded.path).toBe(query ? `${BASE}${path}?${query}` : `${BASE}${path}`)
    expect(recorded.body).toEqual(body ?? null)
    expect(recorded.contentType).toBe(contentType)
    expect(recorded.authorization).toBe(`Bearer ${TOKEN}`)
  })
})

// ---------------------------------------------------------------------------------------
// The ratchet
// ---------------------------------------------------------------------------------------

describe('the ratchet', () => {
  it('classifies every method in src/api as swept or exempt', () => {
    const swept = new Set(API_CALLS.flatMap((call) => call.covers))
    const unclassified = discoverServiceMethods().filter((id) => {
      const [klass] = id.split('.')
      return !swept.has(id) && !(klass in EXEMPT)
    })

    // A new service method arriving with no test is the whole reason this file exists. If this
    // fails, add a row to the sweep — or, if it genuinely sends nothing, a reason to `EXEMPT`.
    expect(unclassified).toEqual([])
  })

  it('sweeps every id it claims to sweep', () => {
    // The other direction, and the one that rots quietly: a `covers` entry naming a method that
    // no longer exists would keep the ratchet green while covering nothing.
    const discovered = new Set(discoverServiceMethods())
    const claimed = [...new Set(API_CALLS.flatMap((call) => call.covers))].sort()

    expect(claimed.filter((id) => !discovered.has(id))).toEqual([])
  })

  it('exempts nothing that does not exist', () => {
    const classes = new Set(discoverServiceMethods().map((id) => id.split('.')[0]))

    // An exemption list is a claim about what was looked at. A name here that discovery never
    // returns claims to have considered something that is not on the list.
    expect(Object.keys(EXEMPT).filter((klass) => !classes.has(klass))).toEqual([])
  })
})

// ---------------------------------------------------------------------------------------
// The response keys, which are the part a path assertion cannot reach
// ---------------------------------------------------------------------------------------

describe('the keys a list arrives under', () => {
  beforeEach(() => {
    apiClient.setToken(TOKEN)
    seedDb(sweepFixture())
  })

  it.each(MODERATED)('$resource takes its path segment and its response key from one string', async ({ resource, service }) => {
    // Serving the list under the *other* noun has to fail. This is what makes the generic real
    // rather than incidental: renaming the resource moves the path and the key together, and a
    // backend that moved only one of them is a contract break the panel must not absorb.
    const other = resource === 'comments' ? 'answers' : 'comments'
    server.use(http.get(apiUrl(`/${resource}`), () => ok({ [other]: [] })))

    await expect(service.getAll()).rejects.toThrow(/comments|answers/)
  })

  it('reads /comments/reported under `comments`, not `reports`', async () => {
    server.use(http.get(apiUrl('/comments/reported'), () => ok({ reports: [] })))

    // The key is the *resource* name even though the path ends in `/reported`. A panel that
    // looked for `reports` here would read an empty queue on a backend that is working.
    await expect(commentsService.getReported()).rejects.toThrow('comments')
  })

  it('reads /reports under `bugReports`, not `reports`', async () => {
    server.use(http.get(apiUrl('/reports'), () => ok({ reports: [] })))

    // The one endpoint whose key does not match its path at all.
    await expect(feedbackService.getReports()).rejects.toThrow('bugReports')
  })

  it('reads each log under its own noun, so one `LogResource` cannot serve the other', async () => {
    // The two logs go through one reader with the path and the key filled in from a resource
    // record. Serving either under the other's key has to fail: a resource whose two halves
    // could drift apart would read an empty page off a backend that is working, which is what
    // the shared reader has to be prevented from making possible.
    server.use(http.get(apiUrl('/activity-logs'), () => ok({ auditLogs: [] })))
    await expect(activityLogsService.getLogs()).rejects.toThrow('activityLogs')

    server.use(http.get(apiUrl('/audit-logs'), () => ok({ activityLogs: [] })))
    await expect(auditLogsService.getLogs()).rejects.toThrow('auditLogs')
  })
})

/**
 * The guard that stops the three ratchet tests being vacuous.
 *
 * `import.meta.glob` returning nothing would make every filter above run over an empty list
 * and pass, reporting a green ratchet over a surface it never saw. So the partition is
 * asserted as a partition: discovery is non-empty, and every discovered id is either swept or
 * exempt, with nothing left over and nothing counted twice.
 *
 * Deliberately no expected *count*. A number here would have to be edited by whoever adds an
 * endpoint, which is the maintained list this whole file exists to replace; the figure quoted
 * in `docs/testplan.md` is a dated snapshot, and this partition is the authority — the same
 * relationship §0 of that document already sets up between its counts and `coverage/`.
 */
it('discovers a surface, and every id in it is classified exactly once', () => {
  const discovered = discoverServiceMethods()
  const swept = new Set(API_CALLS.flatMap((call) => call.covers))

  const sweptCount = discovered.filter((id) => swept.has(id)).length
  const exemptCount = discovered.filter((id) => id.split('.')[0] in EXEMPT).length

  expect(discovered.length).toBeGreaterThan(0)
  expect(sweptCount + exemptCount).toBe(discovered.length)
})
