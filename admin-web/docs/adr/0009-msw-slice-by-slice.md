# 0009 — MSW is adopted one feature at a time, not in a big-bang rewrite

**Status:** Accepted — not yet implemented
**Date:** 2026-09-09

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
