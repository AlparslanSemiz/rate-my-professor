# 0008 — The generated OpenAPI schema is the authority on the API contract

**Status:** Accepted — not yet implemented
**Date:** 2026-09-09

## Decision

`docs/api/openapi.json`, pulled unchanged from the backend's `/v3/api-docs`, is the
authority on request and response **shape**. Types are generated from it into
`src/types/api.generated.ts` and are not edited. Three sources are ranked, once and
in writing:

| Rank | Source | Authoritative on |
| --- | --- | --- |
| 1 | `docs/api/openapi.json` (generated) | Shape: paths, methods, parameters, field names, types, nullability |
| 2 | `README.md` §API Reference | Nothing — it is a human-readable summary of the subset the panel calls |
| 3 | backend `docs/admin-api.md` | Meaning: which refusal is `409` and not `403`, what a `reason` code implies, why `POST /reports` does not move |

Where 1 and 3 disagree on shape, 1 wins. Where 1 is silent on behaviour, 3 wins.
Where 2 disagrees with either, 2 is stale and gets fixed.

## Context

The panel's types are hand-written in `src/api/`. Nothing checks them against the
backend. The suite has 273 tests and **no page test touches HTTP**: the integration
files replace the service modules with `vi.mock`, so what a screen actually sends is
asserted only inside service unit tests, against fixtures the same repository wrote.

A field the backend renamed would therefore pass every test in this project and fail
in the browser. That is not hypothetical — `F-002` was exactly this. `/auth/me`
reports `username` and `kitEmail`; `AuthUser` read `name` and `email`; both were
`undefined`, the stored session was rejected on every reload, and the elevated
operator permission never reached the UI at all. It shipped, and it was found by a
person, not by the suite.

`docs/TODO.md` recorded this phase as **blocked for want of a schema**. That was
wrong: the backend has run springdoc all along and serves `/v3/api-docs`.

## Alternatives considered

**Keep hand-written types and be careful.** Rejected by `F-002`, which is what being
careful produced.

**Take the backend's `docs/admin-api.md` as the authority.** It is far richer than
the schema — it explains refusals, migrations and rate limits, and no OpenAPI
document can carry that. Rejected as the *primary* source because it is prose,
maintained by hand, and cannot fail a build. It is ranked third and is authoritative
on meaning, which is the part it is actually good at.

**Write `zod` schemas per endpoint and validate at runtime.** Real work with real
value, and rejected for now on cost: it is a schema per endpoint, hand-maintained,
which is the same drift problem one layer down. `zod` earns its place in exactly one
file — validating the stored session, where the input is genuinely untrusted.
Generating from the contract is the cheaper half of this and comes first.

**Generate a client, not just types.** Rejected: `ApiClient` and the `HttpService`
hierarchy carry behaviour a generator would discard — the bearer token, `401` ending
the session, an unreachable backend deliberately *not* ending it, and the envelope
handling. Only the types are generated.

## Rationale

The schema is produced **by the running backend from its own controllers**, so it
cannot drift from the implementation the way a hand-written document can. Committing
it makes the contract a reviewable artefact: the diff between two pulls is exactly
what the backend changed, which is why the file is committed byte-for-byte and never
reformatted.

Ranking the sources is the load-bearing half of this decision. Two documents both
claiming to be the contract is how `README.md` came to describe endpoints the panel
no longer calls.

## Consequences

**A mismatch is escalated, never resolved unilaterally.** When generated types and
hand-written ones disagree, neither side is assumed correct: the mismatch is listed
and decided by a person. The schema may be wrong — springdoc infers, and an
`Object` in a controller signature becomes an unhelpfully open type — and the panel
may be wrong. Guessing produces a change that compiles and is untrue.

**Two mismatches are already open and are not being fixed here**, because both are
behaviour changes:

- The backend now serves every admin route under an `/admin` prefix as well as its
  old path, and says the legacy paths are removed once the panel has moved. The
  panel still calls `/users`, `/auth/me`, `/audit-logs`, `/reports`, `/ratings`,
  `/system/status` and `/data/lectures`.
- `GET /admin/data/lectures/all` and `GET /admin/data/professor/all` already return
  every record, active or not — which is what `G1` in `docs/backend-tasks.md` is
  still asking for.

**Refreshing the schema needs a live backend and an admin token**, since
`/v3/api-docs` is behind `hasRole("ADMIN")`. It is therefore a manual step with a
written procedure, in `docs/api/README.md`, not something CI can do.

**The schema pins shape, not behaviour.** It cannot express that a `401` must end the
session while a network error must not, or that only `ACTION_TAKEN` hides content.
Those stay as tests.

## Sources

New decision. Supersedes the "Contract source" row of the test-strategy table in
`docs/TODO.md`, which named "an OpenAPI schema **or** `admin-api.md`" without
ranking them, and the Phase 7 note claiming no schema exists.
