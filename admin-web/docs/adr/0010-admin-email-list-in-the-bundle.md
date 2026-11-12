# 0010 — The admin address list ships in the frontend bundle

**Status:** Accepted
**Date:** 2026-09-09 *(recorded; the decision predates this folder)*

> This record and [0011](0011-session-in-browser-storage.md) are written as
> defences. Both describe a cost the project has **knowingly accepted**, and both
> say what would have to change to remove it.

## Decision

`REQUIRED_ADMIN_EMAILS` in `src/utils/adminAccess.ts` holds the six KIT addresses of
the admin team, in source, and therefore in the production bundle. It is used for
two things and nothing else:

1. **Who is offered a login code.** An address outside the set never reaches
   `POST /auth/request-login`; the panel says so and sends nothing.
2. **What role those six addresses are displayed with.** `withRequiredAdminRole`
   reports them as `ADMIN` in the panel even when a read says otherwise.

An identity is **never** built from this list. The comment at the code says why: an
id the backend did not issue must never be sent back to it — that bug once made a
forged id the author of a warning.

## Context

This is verifiable rather than argued. In a production build the addresses are in
`dist/assets/adminAccess-*.js`:

```
$ grep -c "unzhz@student.kit.edu" dist/assets/*.js
dist/assets/adminAccess-bDEqxPPx.js:1
```

Anyone who loads the panel can read them. There is no build step that removes them
and no honest way to write one, because the check runs in the browser.

## Alternatives considered

**Ask the backend "may this address sign in?" before requesting a code.** The
obvious fix, and it is worse. That endpoint has to answer an **unauthenticated**
caller — the check happens before login — so it is an address oracle: anyone can
enumerate which addresses are admins, one request at a time. Trading a fixed list of
six for an unbounded query against all of KIT is not an improvement.

**Drop the pre-check and let the backend refuse.** Defensible, and it costs the
error message that exists because it is genuinely useful: *"You do not have access
to this panel. It is limited to the admin team, so no login code was sent."* Without
it a student who tries gets a code by mail and then a `403`, which reads as a broken
panel. It also sends real mail on every attempt by anyone.

**Ship the list as a build-time environment variable.** Rejected as
security theatre: `VITE_*` values are inlined into the bundle at build time, so the
addresses are in exactly the same place, only harder to find in the source.

**Hash the addresses and compare digests.** Rejected. Six known-format KIT addresses
are a five-character keyspace over a fixed domain; a wordlist recovers them in
seconds. It would obscure the list from a casual reader while claiming a protection
it does not provide, which is worse than being plain.

## Rationale

**This is a usability boundary, not a security one, and nothing rests on it.** The
backend validates the token independently and requires an `admins` row for every
protected endpoint; a valid non-admin token is answered `403` regardless of what the
panel believes. Deleting `adminAccess.ts` entirely would change the error messages
and change no permission.

**The second use is subtler and worth stating.** `withRequiredAdminRole` overrides
the displayed role because the backend's own `ADMIN_BOOTSTRAP_EMAILS` re-promotes
these addresses on the next restart or sign-in. A panel showing `STUDENT` for an
address the backend is about to re-promote would be reporting a state that does not
survive the next request. The override makes the panel agree with what the backend
will do, and it is display-only — it changes which controls are drawn, never what
the backend accepts.

**What the exposure actually is.** KIT student addresses are pseudonymous
`u`-codes — `unzhz@student.kit.edu` names nobody on its own. The first names sit
beside them as source comments and are **stripped by the minifier**; they are not in
the bundle, which was checked rather than assumed. So what leaks is six opaque
addresses at a public university domain, to an audience that has already loaded an
internal admin panel.

## Consequences

**Accepted, explicitly.** Six real KIT addresses are readable in shipped JavaScript.
For an internal panel behind a login, with the security boundary on the backend, this
is judged an acceptable cost against the alternatives above — each of which is either
worse or fake. It is written here so that it is a decision and not an oversight.

**Two lists move together.** `REQUIRED_ADMIN_EMAILS` here and
`ADMIN_BOOTSTRAP_EMAILS` on the backend have to agree, and nothing enforces it. This
is the *last* such pair: the elevated-operator list used to be a second one, and was
removed when the permission moved to `isSuperAdmin` on `/auth/me`
([0004](0004-elevated-operator-is-behaviour-not-a-role.md)).

**Adding a team member is a frontend release.** For a fixed six-person course
project, acceptable; for a panel with changing staff, this record should be
revisited before the list is edited a third time.

**If the panel ever leaves the course**, the fix is to drop the pre-check, accept the
worse error message, and let the backend be the only gate. That is a small change,
and this record exists so the reason it was not made is on file.

## Sources

`src/utils/adminAccess.ts`; `README.md` §Who may sign in — "This client-side gate is
a usability boundary, not a security one"; `docs/backend-tasks.md` §Contract details
worth keeping.
