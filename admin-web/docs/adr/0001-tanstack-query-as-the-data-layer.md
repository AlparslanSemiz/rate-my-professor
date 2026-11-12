# 0001 — TanStack Query is the data layer

**Status:** Accepted
**Date:** 2026-09-09

## Decision

Every read in the panel is a `useQuery` or `useInfiniteQuery`, and every write is
its own `useMutation` that invalidates what it changed. No feature hand-rolls
loading, error, staleness or cache state.

## Context

Before the refactor, fetching was a hand-built state machine. `useCursorLogPage`
took **13 options and returned 15 fields**; `useAsyncData` and `useVisibleInterval`
sat beside it doing overlapping work. Each feature then reimplemented the same
four concerns: a `loading` flag, an `error` string, an "is this response still the
one I asked for?" guard, and a refresh callback threaded down through props so a
child could tell its parent to re-read.

Three specific costs were visible in the code:

- **A `latestRead` ref** in the dashboard existed only to discard a response
  overtaken by a newer one.
- **`useVisibleInterval`** was 59 lines of `visibilitychange` and `setInterval` to
  stop polling a hidden tab.
- **`setReports: Dispatch<SetStateAction<BugReport[]>>`** was passed *into* the
  feedback write hook so the writes could patch the list themselves.

## Alternatives considered

**Keep the hand-rolled hooks and tidy them.** Cheapest, and it is what two earlier
refactor passes had already tried. Both made files smaller by splitting them rather
than by removing work; the second-order duplication survived both. Rejected because
the problem was not file size.

**SWR.** Smaller and simpler. Rejected on `useInfiniteQuery`: four screens page on
a cursor and need append-not-replace with the previous page kept on screen while a
new filter runs. SWR's infinite support is thinner, and that behaviour is the
single most fragile thing in the panel.

**RTK Query.** Rejected because it brings Redux, and the panel has no client state
worth a store. Everything it holds is either server state or one component's own.

**Write a small shared `useResource`.** Rejected as the same mistake at a smaller
scale: request deduplication, cache invalidation, retry policy and stale-while-
revalidate are the hard parts, and a house version of them is a library nobody
maintains.

## Rationale

The hand-rolled layer was not solving a problem the library does not solve — it was
solving exactly that problem, worse and in nine places. Adopting the library deleted
three hooks outright and let the fetching **policy** be stated once, in
`src/query.ts`, with its reasoning written down:

- Reads stay trusted for 30 seconds, chosen against how the panel is used: an
  operator works one case across three screens, and re-reading every list on each
  hop is noise.
- A `4xx` is **not** retried. `401` ends the session; `403` and `404` will refuse
  again; `400` means the panel sent something wrong. Each retry only delays the
  message the operator needs.
- Mutations are never retried, because repeating a write risks applying it twice.

One rule the library does not supply is kept as a model function: the dashboard's
`lastUpdated` may move only when **both** reads succeed **and** the status carried
counters, so the timestamp never vouches for numbers that did not arrive.

## Consequences

**Behaviour was preserved and it is provable.** The audit log's nine page tests,
the catalogue's twelve and the feedback page's eleven all passed *unchanged*
through their migrations, including the awkward ones — that "Load more" appends
rather than replaces, and that a change the backend accepted is reported as saved
even when the re-read afterwards fails.

**Branch coverage fell slightly and will not fully recover.** The deleted state
machines were dense in branches the suite did exercise; what replaced them are
derived expressions like `isPending || (isFetching && !isFetchingNextPage)` whose
combinations cannot all occur in a test. This is structural, not a missing test —
three tests were written chasing it before that became clear.

**Query keys are now a contract.** They are a module-scope const in the hook that
owns them, and get their own file only when several hooks share one. Getting a key
wrong is a new class of bug: the moderation screen is generic, so without the noun
in the key, comments and answers would share a cache entry and show each other's
rows.

**Two things had to be learnt the hard way**, and both are recorded so they are not
rediscovered: `placeholderData: keepPreviousData` is mandatory on any cursor list,
or a refused filter empties the table the operator needed to read the refusal
against; and re-applying an unchanged filter produces no request at all unless the
hook refetches explicitly, because the query key is identical.

**Vitest's fake timers do not compose with it.** Vitest fakes `queueMicrotask`,
which is how the query client notifies its observers, so a polled refetch never
reaches the component. Tests that need a refresh drive the query client directly
instead of the clock.

## Sources

`CHANGELOG.md` — refactor steps 3 and 5 through 11, and `src/query.ts`.
