# 0004 — The elevated operator is a behavioural privilege, never a role

**Status:** Accepted
**Date:** 2026-09-05

## Decision

One address may act on **admin** accounts as well as student ones. `UserRole` stays
`'STUDENT' | 'ADMIN'`. There is no badge, no label, no visual difference, and no
route or navigation gating. The panel reads `isSuperAdmin` from `/auth/me` and uses
it for one thing: whether a control is offered.

## Context

The team needed one operator able to warn, block, unblock and delete another admin
and to change an admin's status. The backend refused those with `409`, so the panel
offered buttons that could not work.

## Alternatives considered

**Add `SUPERADMIN` to `UserRole`.** The direct expression of it, and rejected as a
hard constraint on the backend as well. `UserRole` is a two-value union rendered in
the sidebar, the header, the user table, the edit form's role dropdown and the audit
log's actor. A third value would have to be handled in every one of them, and the
`role` field is *also* what the backend sends for ordinary reads — so a new value
would leak into `GET /users` for every consumer, including the Android client.

**Keep an address set in the frontend.** This is what an earlier draft did, and it
shipped. It was removed because the set had to be edited in **two repositories at
once** to stay correct, and a panel that believes it is elevated when the backend
disagrees offers controls that fail.

**Render a badge so the operator can see their own privilege.** Rejected as a
non-goal: the privilege is not the operator's identity, and a visible tier invites
the question of who else has it.

## Rationale

**The permission is the backend's to grant.** It resolves it from
`ADMIN_SUPERUSER_EMAILS` and reports it as `isSuperAdmin`; the panel only reads it.
That is what makes the client-side gate honest — it is showing what the backend will
accept, not deciding it. A non-elevated admin who forges the flag gets a `409` from
the server.

Keeping it invisible follows from the same place. The distinction changes what one
person may *do*, not what anyone *is*, and the audit log already records who did
what.

## Consequences

**The flag is optional on `AuthUser`.** A session stored before the backend reported
it stays valid, and an absent flag grants nothing.

**Self-protection is unconditional and stays that way.** Nobody changes their own
role or status, blocks or deletes themselves, elevated or not. The risk this guards
against is locking the last operator out of the panel.

**`metadata.elevated` is deliberately not rendered.** The backend marks entries only
an elevated operator could have written. Surfacing it would be the first visible
difference between an elevated operator and any other admin — which is exactly what
this record rules out — so it needs a decision of its own rather than being added
because the field is available.

**One field being wrong hid the whole feature.** `/auth/me` reports `username` and
`kitEmail`; `AuthUser` read `name` and `email`. Both were `undefined`, so the stored
session was rejected on every reload and the elevated permission was computed from an
empty address — it had never reached the UI at all. `me()` now reads either spelling.
Recorded as `F-002`.

**The feature is implemented but not yet verified end to end** against the deployed
backend. It is carried as `F-001`, open, and the panel does not claim otherwise.

## Sources

`CHANGELOG.md` — "Added — elevated permissions" and its "Unchanged on purpose";
`docs/backend-tasks.md` §A; `docs/TODO.md` Non-goals.
