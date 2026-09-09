# 0009 — MSW is adopted one feature at a time, not in a big-bang rewrite

**Status:** Accepted — implemented, and extended once as the rule predicted
**Date:** 2026-09-09 (amended 2026-09-09)

## Decision

Mock Service Worker replaces `vi.mock` of the service modules **for the Comments
feature only**, as a reference slice. Every other feature keeps its existing tests
unchanged. This reverses the decision recorded in `docs/TODO.md`.

## Context

`docs/TODO.md` recorded, under "Decisions already taken":

> **MSW migration** — Big-bang: all 9 page tests rewritten at once, `vi.mock` of
> services removed.

That was decided when the test strategy was written and before the refactor
happened. Two things have changed since.

**The suite is now the only safety net there is.** Twelve refactor steps landed
against `npm test` passing after each one. The page tests are what established that
the migrations were behaviour-preserving — the audit log's nine, the catalogue's
twelve and the feedback page's eleven all passed *unchanged* through their
rewrites, and that is the whole evidence.

**Two days remain.** Rewriting nine integration files at once, against handlers that
are themselves new and unproven, means the suite is red for as long as it takes and
gives no signal about anything else in the meantime.

## Alternatives considered

**Big-bang, as recorded.** It has one real advantage: no interval where two testing
styles coexist, and no risk that the second style never arrives. Rejected on the
schedule. A rewrite of nine files that is 70% done at the deadline has produced
nothing — the remaining 30% is red — whereas one finished slice is a complete,
demonstrable thing.

**Do not adopt MSW at all; assert the request in the service unit tests.** They
already do exactly that, and it is not enough: a service test proves the service
sends `limit=50`, not that the *screen* asks it to. The gap between them is where
`F-002` lived.

**Adopt MSW for the whole transport but keep `vi.mock` at the page level.** A
contradiction — `vi.mock` of the service is what stops the request being made at
all.

## Rationale

Comments is the right slice, for reasons that are specific rather than convenient:

- It is the only screen that is **generic over its resource**. `ModerationPage` is
  driven through a `ModerationApi` interface that `CommentsPage` implements over
  two services, so the noun is the only difference between comments and answers.
  A handler that gets the envelope wrong breaks it twice.
- It carries the **three behaviours documented as decisions** rather than as code:
  a `401` ends the session and the attempted path travels in `state.from`; an
  unreachable backend does **not** end the session; `ACTION_TAKEN` hides content and
  every other status restores it.
- Its writes invalidate **both** lists, because the two are views of the same
  records — the kind of thing `vi.mock` cannot check, since nothing is actually
  re-read.

The slice also makes the handlers prove themselves on a hard case before eight other
files depend on them.

## Consequences

**Two testing styles coexist**, and that is the cost. It is mitigated by writing
down which is which — the migrated feature is named in `docs/TODO.md` and in
`docs/testplan.md`, so "why does this file mock the service?" has an answer that is
not "nobody got to it".

**The convention for new code is MSW.** A module being worked on moves; a module
nobody is touching stays. That is the rule the project already applies to `@/`
imports and to `model/` packages.

**`onUnhandledRequest: 'error'` applies to the migrated file only**, or every
unmigrated test would fail on requests that legitimately never happen because the
service is mocked.

**The remaining eight files are a known debt with a named owner** — the handover
note in `docs/TODO.md` lists them, with the handlers each would need.

**If this slice does not land, nothing is worse than it is today.** That asymmetry
is the argument.

## Sources

New decision. Supersedes the "MSW migration — Big-bang" row in `docs/TODO.md`.

## Amendment — what the rule actually moved

The Comments slice landed as specified: `vi.mock('@/api/moderation')` is gone, the
page's real services run, and the assertions are on the path, the method, the JSON
body and the `Authorization` header. The three behaviours this record names as the
reason for choosing Comments are covered, including the half that had never been
tested — **every status other than `ACTION_TAKEN` restores the content**, which can
only be checked by making a request and reading what the next one returns.

Five more modules followed, not because the decision changed but because the rule in
"Consequences" applied: *a module being worked on moves*. The Entwurf pass rewrote
how every one of them reports failure, so each was being worked on.

| Module | Why it moved |
| --- | --- |
| `App.integration.test.tsx` | Holds the session behaviours. "The identity comes from `/auth/me` and nowhere else" was an assertion that a function had not been called; it is now "no request was addressed to the user list". |
| `auth/LoginPage` | The admin-team check is meant to stop a code being *requested*. Only a real request layer can show that none went out. |
| `context/AuthContext` | Rewritten by the typed-error work; also renamed `.integration.`, which is what it always was. |
| `audit-logs/AuditLogsPage` | The one screen that filters **server-side**. What a test could prove about filtering was entirely about a query string that a service mock never built. |
| `users/UsersPage` | Already had a hand-written backend — a mutable array, a `list` that applied `q`/`status`/`role`, `block`/`unblock` writing back. That was this decision's handlers, in one file, without the request. |

**Five files still replace their service**, which is the state this record predicted
and defended: catalogue, feedback and the dashboard were not touched, and the two
`vi.mock`s left in unit tests isolate a single unit, which is what a unit test is
for. `onUnhandledRequest: 'error'` is still per-file, for the reason given above.

**One thing the migration found that the mocks had hidden.** The store holds warnings
in the shape a screen reads; the handler puts them back on the wire with the issuer
nested under `createdFrom`, because that is how they arrive. Serving the flattened
shape would have skipped `toWarning` entirely — the same class of gap as `F-002`, in
the same mapper layer, and it only became visible once a real response had to be
parsed.

**The handlers grew a second job.** They also serve the browser, under
`VITE_MOCK_BACKEND`, which is what lets the Playwright layer run against no backend
at all. That was not foreseen here and is the larger part of what the investment
bought: one description of the contract, used by the integration tests, the
end-to-end tests, and anybody who wants to look at the panel without a deployment.

## Second amendment — where the line sits now

**Date:** 2026-09-09.

The rule in *Consequences* — a module being worked on moves — moved two more files,
and both for the reason the rule names rather than by choice.

| File | Why it moved |
| --- | --- |
| `src/layouts/AdminLayout.integration.test.tsx` (new) | The shell gained something to say — the unconfirmed-session notice (`F-013`) — and it is driven by a request. `src/layouts` had **no test of any kind** before this. |
| `src/api/client/bodylessWrites.integration.test.ts` (new) | It asserts that five writes send **no `Content-Type`**. A header only exists once a request has been built, so `vi.mock` could not express this test at all. |

**Eight files on MSW, five still replacing their service.** Named in
`docs/testplan.md` §2, both lists, so neither can quietly grow.

**The second file is the more interesting one, because it shows the rule's limit.**
It is a test of the *client*, not of a screen, and it lives outside the slice-by-slice
scheme entirely: the request it needs is produced by no page the suite drives. The
GitLab escalation's own page still replaces `@/api/feedback`, so the only way to
observe `POST /reports/{id}/gitlab-issue` was to call the service directly. A feature
staying on `vi.mock` does not merely leave its screen untested against the wire — it
can make a *contract* fact unobservable from anywhere, and the fact then has to be
tested somewhere that does not correspond to a user-facing flow.

**Catalogue is now the notable hole.** It is the one feature with no handlers at all,
so nothing about its requests is exercised anywhere in the project. Feedback and the
dashboard at least have handlers their end-to-end specs drive.

**The prediction in the first amendment held.** Five files still replace their
service, and none of them was touched by this work. That is the decision behaving as
recorded rather than eroding.
