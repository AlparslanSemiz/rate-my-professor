# 0013 — Errors are types, not status codes

**Status:** Accepted
**Date:** 2026-09-09

## Decision

Every failure the API layer raises is its own class under an abstract `ApiError`.
`ApiResponseParser` is the only code in the panel that reads an HTTP status;
everywhere else catches a named type.

## Context

`ApiError` was a single class carrying a `status`, and it was thrown for five
different things: an HTTP failure, a `2xx` body reporting `success: false`, an
unreachable or CORS-refused host, a body that was not JSON, and a payload missing a
field the panel relies on. The last three all used `status: 0` — a sentinel
standing in for "this is not an HTTP status at all".

Callers therefore discriminated on a number, in six files across four layers:
`query.ts`, `AuthContext.tsx`, `auditLogModel.ts` (twice), `authenticateAdmin.ts`
(twice) and `useUserProfile.ts`. Nine raw status literals in feature code.

It also produced a live defect. `query.ts` treated anything that was not a 4xx as
worth retrying, and `status: 0` is not a 4xx — so a response the panel could not
parse was requested twice more, for nothing, delaying the message the operator
needed.

## Alternatives considered

**Keep one class and add a `kind` discriminant.** `ApiError` gains
`kind: 'http' | 'network' | 'contract'`, and callers switch on it. Cheaper, and it
fixes the retry defect. Rejected because it moves the problem rather than solving
it: callers still discriminate on a value instead of on a type, `instanceof` still
tells them nothing useful, and the `switch` a reviewer objects to is still there —
now over a string instead of a number.

**Keep one class and add predicates** — `isNotFound(error)`, `isConflict(error)`.
Better than a bare comparison and still a function per case, defined away from the
class, with nothing making the set exhaustive.

**Subclass only where a caller discriminates today** — four classes, not eleven.
Rejected because "where a caller discriminates today" is not a property of the
domain, and the next caller would add a fifth by hand. The set is the backend's
documented status vocabulary; deriving it from current usage would make it drift.

**Named status constants only** (`HTTP_STATUS.conflict === error.status`). Fixes
the magic numbers and none of the rest. It is kept, but as the table's input rather
than as the call sites' vocabulary.

## Rationale

**The distinction that matters is not the number.** Whether a retry could work,
whether the operator can act on the message, and whether the session is over are
three different questions, and none of them is answered by comparing a status. They
are answered by what the failure *is*: `NetworkError` may pass, `ContractError`
never will, `UnauthorizedError` ends the session.

**The retry rule became polymorphic instead of conditional.** Each error answers
`transient` for itself, so `shouldRetry` no longer knows about statuses at all, and
a new failure mode does not mean editing it. That is the anti-pattern criterion
satisfied by construction rather than by discipline.

**One place maps a number to a meaning.** `responseErrorFor` is a table, not a
`switch`, and adding a status the panel treats specially is a subclass and a row.
Nothing else in the codebase reads `response.status`.

**The sentinel is gone.** `status: 0` was doing type discrimination through a
magic number, which is two criteria failing at once.

## Consequences

**Eleven classes where there was one.** That is more surface, and most of it is
constructors delegating upward. The argument for it is that each name is used —
every subclass is caught somewhere or constructed in a test.

**`ApiError` is abstract**, so `new ApiError(404, '…')` no longer compiles. Thirteen
test sites had to change, and they read better for it: `new NotFoundError('No such
user')` says what the fixture is.

**A caller can still ask for `error.status`** on a `ResponseError`, and nothing
stops a future comparison being written against it. The field is genuinely needed —
the message a `400` carries is worth showing — so it stays public and the
discipline is a convention.

**Behaviour changed, in one place.** A `ContractError` is no longer retried. That
is a fix, and it is the only behavioural difference in the whole hierarchy.

## How it was applied afterwards

Recorded because the decision above is written abstractly, and an abstract principle
is worth what its first real use is worth. This is that use.

**`AuthContext` had to decide which failed session checks to tell the operator about**
(`F-013`). A `401` ends the session and always did. Everything else keeps it — but
saying nothing at all was how a removed `/auth/me` could have gone unnoticed, so
something had to be reported. Not *everything*, though: a dropped connection heals
itself, and a warning that fires on every blip is a warning nobody reads.

The obvious implementation is a list of statuses worth reporting. That is the shape
this record exists to prevent, and it would have put a fourth copy of "which numbers
mean what" into a fourth layer.

What it does instead is ask the failure:

```ts
if (error instanceof ApiError && error.transient) return
setSessionCheckError(SESSION_UNCONFIRMED_MESSAGE)
```

`NetworkError` and a `500` answer `transient` and stay quiet. `NotFoundError`,
`ForbiddenError` and `ContractError` do not, and are reported. **No status appears in
the feature layer, and no list had to be maintained** — the classification was already
carried by the type, put there for the retry predicate, and a second caller reused it
without extending anything.

**The same round produced the counter-example.** `authenticateAdmin` wrapped the
identity read in a bare `catch` returning `null`, which collapsed a `401`, a `403`, a
`404` and a network failure into one sentence that was wrong for three of them
(`F-014`). The damage was not the wording: it was that `getLoginErrorMessage`, which
already knew a `ForbiddenError` means "not authorized", could no longer recover it —
**the type had been discarded before anything could read it**. Catching and rethrowing
by type fixed the message and restored the downstream decision at once.

That is the argument for this record, stated in the concrete: the value is not that
errors have names, it is that a caller three layers away can still tell them apart.

## Sources

New decision. Supersedes nothing; `ApiError` and its `reason` field are unchanged
in intent, and the `409` refusal codes it carries are still the ones
`docs/admin-api.md` documents.
