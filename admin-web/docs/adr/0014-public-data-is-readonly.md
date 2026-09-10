# 0014 — Public data is readonly, and services get a narrow transport

**Status:** Accepted
**Date:** 2026-09-09

## Decision

A module does not hand out a mutable reference to anything it owns. Exported
collections are `readonly`, exported shared defaults are frozen, and the nineteen
API services receive an `HttpTransport` interface rather than the `ApiClient` that
also owns the session.

## Context

Two things were true at once. The panel had good module boundaries — perfect barrel
discipline, no upward dependencies, a real generic abstraction in
`ModerationService` — and it handed out mutable references across every one of them.

`readonly` appeared four times in `src/api`, `src/domain`, `src/utils` and
`src/constants` combined. Twenty-two exported singletons were unfrozen, including
`EMPTY_LOG_META`, whose four arrays were reachable through a second exported name
that pointed at the same object and which flowed into React state. And
`HttpService` held the whole `ApiClient`, which publicly exposes `setToken` and
`setOnUnauthorized` — so `BugReportsService` could sign the operator out.

None of it had caused a bug. That is the point of recording it: the boundary was
convention, and convention is what a design review is asking about.

## Alternatives considered

**Freeze at runtime only.** `Object.freeze` everywhere, no type changes. Catches
the mutation, at the point it happens, in production, as a silent no-op in
non-strict code. It is a worse version of a compile error.

**Type as `readonly` only.** No freezing. Honest about intent and defeated by a
single `as`, which is exactly what a test fixture reaches for.

**Deep-freeze everything through a helper.** Rejected on the specifics: the
`HELP_SECTIONS` and nav-item arrays hold React component references, and freezing
those is a change to objects the framework owns for no benefit the type system does
not already give.

**Leave `HttpService` holding `ApiClient` and rely on nobody calling `setToken`.**
What was happening. It is precisely the thing this criterion asks about, and it was
the cheapest of the three changes to make.

**Give each service only the verbs it uses** — a per-service interface. Genuinely
narrower and not worth it: nineteen interfaces of one to four methods, and the
capability that mattered was the session, which none of them needs.

## Rationale

**Both mechanisms, chosen per case.** `readonly` types are the primary statement,
because the compiler enforces them at every call site and the message names the
file. `Object.freeze` goes on the *shared defaults* specifically — the ones where a
single object answers every caller, so one mutation is a process-wide corruption
rather than a local bug.

**The type change paid for itself immediately.** Marking collections `readonly`
produced eight compile errors, seven of which were consumers that only read and
should have said so. The eighth was a real aliasing bug: `createProfessorEditDraft`
put the caller's array straight into the draft the form then edits, so an edit in
progress shared a reference with the catalogue query's cache.

**The transport narrowing is the strongest single result.** The right decomposition
already existed inside `ApiClient` — `ApiSession` holds the token, `ApiRequestBuilder`
builds the request — and it was undone at the boundary by handing the composite
over whole. `HttpTransport` restores it. Who holds the token is a decision that
belongs to `src/context`, and now nothing else *can* hold it.

**A dead method went with it.** `withQueryParams` had no callers and dragged a type
through two barrels.

## Consequences

**Test fixtures are stricter.** A fixture that supplied a counter the panel never
reads no longer compiles. That is the intended effect and it did find stale
fixtures, but it is friction, and a fixture factory would take some of it back.

**`readonly` is shallow.** `readonly User[]` stops the array being reordered and
does nothing about a `User` inside it. Going further means `ReadonlyDeep` on every
domain type, which is a large amount of noise for a much smaller gain.

**Frozen objects fail silently in non-strict contexts.** A mutation through an
untyped path is a no-op rather than a throw. The compile-time half is what actually
prevents it; the freeze is a backstop.

**Services can no longer reach the session at all**, which is the point, and which
means a genuine future need — a service that must retry after a refresh, say —
becomes an explicit change to this interface rather than a quiet call.

## Sources

New decision, prompted by the Entwurf criteria. The `ApiSession` /
`ApiRequestBuilder` split it restores at the boundary is from the refactor's
step 4, recorded in `CHANGELOG.md`.
