# Backend tasks — admin panel (`admin-web`)

Hand this file to the backend repository. It holds everything the admin panel
needs from the backend and cannot do itself. Section A is the elevated operator;
section F is the contract gaps the panel still works around. Sections G and H
ask for nothing — they are notices, kept here so that nobody schedules a change on
an assumption this file can correct. Section J is about how the panel is *served*
rather than about the API, and is here because the proxy in front of it is not in
our repository.

---

# A. Elevated operator for the admin panel

The admin panel has already been changed; this is the part it cannot do itself.

## Goal

`unzhz@student.kit.edu` must be able to moderate **other admin accounts**, not
only students. Today those requests are refused with `409` (and admin-only
endpoints with `403`), so the panel offers the buttons but the action fails.

Stated as one rule: **an elevated operator may change anything on another
admin's account; an ordinary admin may only do so against non-admin (student)
accounts.**

Two hard constraints:

1. **The role stays `ADMIN`.** Do not introduce a `SUPERADMIN` value in the
   `role` field. `/auth/me`, `GET /users` and `GET /users/:id` must keep
   reporting `"role": "ADMIN"` for this account — the panel's `UserRole` union
   is `'STUDENT' | 'ADMIN'` and a third value would break its rendering. If the
   distinction needs to travel to the client, add a **separate** field (see
   section A5), never a new role.
2. **Self actions stay refused.** No one blocks, deletes or demotes their own
   account, elevated or not. The panel keeps hiding those controls for the
   operator's own profile; the backend should keep rejecting them regardless.

## A1. A way to mark the elevated account

Pick whichever fits the existing setup:

- an env var alongside `ADMIN_BOOTSTRAP_EMAILS`, e.g.
  `ADMIN_SUPERUSER_EMAILS=unzhz@student.kit.edu`, resolved at bootstrap the same
  way; or
- a boolean column on the `admins` table (`is_super`, default `false`), seeded
  from that env var.

The column is preferable if the set is expected to change without a redeploy.
Whatever is chosen, it must be normalized the same way the panel normalizes:
trim + lowercase.

## A2. Endpoints that must accept an elevated operator

For each, the current behaviour is "refuse when the **target** account has role
`ADMIN`". That refusal should be lifted when the **caller** is elevated and the
target is not the caller.

| Endpoint | What must become possible |
| --- | --- |
| `PATCH /users/:id` | Change `status` (`ACTIVE` / `BLOCKED`) and `credibilityScore` on an admin target. `username` / `biography` already work. |
| `PATCH /users/:id` (`role`) | Demote an admin target to `STUDENT` (and the existing sign-out of that account still applies). Never on self. |
| `POST /users/:id/warnings` | Issue a warning against an admin target. |
| block / unblock | Block and unblock an admin target. |
| `DELETE /users/:id` | Delete an admin target. |

Refusals that must **stay**:

- caller `id` == target `id` for block, unblock, delete and `role` — answer the
  same status as today;
- any of the above from a non-elevated admin against an admin target — unchanged
  `409`;
- everything for a non-admin token — unchanged `403`.

## A3. Audit log

Every one of these actions must be recorded with the acting admin as actor, the
same shape the panel already renders
(`actor: { name, email, role }`, `role` being `"ADMIN"`). Recording that the
actor was elevated is useful — but as a separate field or in the event metadata,
not by changing `actor.role`.

## A4. Tests worth having

- an elevated admin blocks, warns, unblocks and deletes another admin → success;
- an elevated admin edits another admin's status and credibility score →
  success;
- a normal admin does any of the above → unchanged `409`;
- an elevated admin tries it on their own account → refused;
- `/auth/me` for the elevated account still answers `"role": "ADMIN"`.

## A5. Report the permission on `/auth/me` — **done**

The panel no longer keeps a hardcoded address set of its own. The backend
resolves the permission from `ADMIN_SUPERUSER_EMAILS` and reports it as
`isSuperAdmin` on `/auth/me`:

```json
{ "success": true, "message": "OK",
  "user": { "id": "...", "name": "...", "email": "...", "role": "ADMIN", "isSuperAdmin": true } }
```

`SUPER_ADMIN_EMAILS` and `isSuperAdminEmail` are gone from
`src/utils/adminAccess.ts`; the panel reads the flag and nothing else. `role`
must still be `"ADMIN"` in that response. Kept here as the record of the agreed
contract — nothing further is needed.

---

# F. `/system/status` and bug report gaps

## F1. No total bug report counter

`counts.openBugReports` reports the open ones only. There is no total, so the
dashboard cannot say "N of M bug reports". The panel removed its "of N bug
reports" sub-line and its "Reports handled" percentage rather than reading the
whole `/reports` table on a timer to derive them.

**Asked for:** a total bug report count in `/system/status` `counts`, alongside
the existing `openBugReports`.

## F2. No blocked account counter

`counts` carries `users`, `activeUsers` and `admins`. `users - activeUsers` is
blocked *plus* inactive, so blocked cannot be derived from it. With the Users
table paginated it cannot be counted on screen either, so that stat card is not
shown at all.

**Asked for:** a blocked account count in `/system/status` `counts`.

## F3. A bug report has no `statusChangedAt`

A report carries `reportedAt` only. The Bug Reports History tab can therefore
show when a report was *filed*, but not when it was closed; the subtitle says so
rather than letting a filing date pass as a closing one.

**Asked for:** a `statusChangedAt` timestamp on a bug report, set whenever its
status changes.

---

# G. Catalogue

## G1. Catalogue reads return active records only — **already answered; nothing is asked for**

This was a request. It is now a note, because the endpoint already exists and we
had not noticed.

`GET /data/lectures` and `GET /data/professor` filter on `active = true`, while
both `PATCH` routes accept `active`. Switching a lecture or professor off from
the panel therefore removes it from the only list the panel currently reads, with
no way back short of a database write.

**But it is already shipped**, and `ModerationCatalogController` says it was built
for exactly this case:

> `/lectures/all` and `/professor/all` exist because the public reads filter to
> `active = true`: a deactivated lecture or professor would otherwise be unreachable
> from the panel to correct or reactivate.

| Endpoint | Returns |
| --- | --- |
| `GET /data/lectures/all`, `GET /admin/data/lectures/all` | Admin-only. Every lecture, active or not. |
| `GET /data/professor/all`, `GET /admin/data/professor/all` | Admin-only. Every professor, active or not. |

Both are mapped on the legacy path as well as under `/admin`, so this does **not**
depend on `H2`.

So there is **no backend work here**, and as of **2026-09-10 there is no gap on our
side either**: the panel now calls both `…/all` reads, with an All / Active / Inactive
filter that defaults to Active so the default view is unchanged from what operators
had before.

**Verified against the deployed instance**, not only against our mocks: both reads
answer 200 for an admin session, `GET /data/lectures/all` returns 95 lectures where
the public `GET /data/lectures` returns 92, and the three inactive ones are reachable
and reactivatable from the panel. A full round trip — deactivate, confirm it leaves
the default list, find it under Inactive, reactivate via
`PATCH /data/lectures/{id} {"active": true}` — was walked on one lecture and one
professor and both were returned to their original state.

Tracked as `F-006` in `docs/testfindings.md`, now closed. **The request to leave both
`…/all` routes in place is now stronger, not weaker**: the panel does not merely want
them, it depends on them. Removing either takes the catalogue's whole read path with
it, not one feature.

---

## Contract details worth keeping

Two behaviours that are correct as they are, recorded so they are not
rediscovered as bugs:

- `counts.admins` counts accounts holding the role, not the allowlist. An
  address in the bootstrap list is re-promoted on the next restart or sign-in,
  so demoting it in the panel does not stick until the address leaves that
  configuration.
- `POST /users/{id}/warnings` accepts the old `userID` + `createdFrom` body
  permanently, not as a temporary shim, so the two repositories deploy in any
  order.

---

# H. Notice, not a request

## H1. The panel calls `/activity-logs` again — **withdrawn 2026-09-10**

**Still nothing asked for, and now the opposite of what this said.**

This entry recorded, on 2026-09-09, that the panel had deleted its Activity Log
screen and no longer called `GET /activity-logs` or `GET /activity-logs/meta`.
That decision was reversed the next day and the screen is back
([ADR 0016](adr/0016-the-activity-log-screen-returns.md)). The panel is a client
of both endpoints again, and of the full student action vocabulary —
`USER_LOGIN`, `USER_LOGOUT`, `COMMENT_CREATED`, `ANSWER_CREATED`,
`RATING_SUBMITTED`, `COMMENT_REPORT_CREATED`, `ANSWER_REPORT_CREATED`,
`BUG_REPORT_CREATED`, `LOGIN_REFUSED`, `ACCESS_REFUSED`.

**The line that mattered mattered more than we knew.** This entry asked you not
to remove those endpoints on our account, on the grounds that a future panel
screen might want them. It was a day, and the endpoints being untouched is why
bringing the screen back cost a rebuild rather than a negotiation. Thank you for
not acting on it.

Nothing changes for the backend either way. The panel reads both logs with the
same parameters, pages them on the same cursor and reverts only on the audit
half, which is the only half `POST /…/revert` is offered on.

The rest of the original entry still holds and is still worth knowing:
`/audit-logs/meta` may report actor type `USER` and target types such as
`USER_SESSION` and `ENDPOINT`, and the panel renders whatever it is given rather
than narrowing your vocabulary to its own. `docs/admin-api.md` lists
`/activity-logs/**` in its path-migration table, which is correct — those
endpoints move under `/admin` with everything else, and the panel is now one of
their clients when they do.

## H2. The panel has not moved to the `/admin` path prefix

**Nothing is asked for here either.** Recorded so that the removal of the legacy
paths is not scheduled on the assumption that we have migrated.

`docs/admin-api.md` states that every administrative route now answers under
`/admin` as well as its old path, and that the legacy paths "are removed once
[the panel] has [moved]". As of 2026-09-10 **the panel has not moved.** It still
calls:

`/auth/request-login`, `/auth/login`, `/auth/logout`, `/auth/me`, `/users/**`,
`/comments/**`, `/answers/**`, `/ratings`, `/reports`, `/audit-logs/**`,
`/system/status`, `/data/lectures/all`, `/data/professor/all`.

The last two changed on 2026-09-10 — the catalogue reads the admin variants now, on
the legacy path — so the list above is the current one. It is the same request either
way: these are legacy paths and the panel is still on all of them.

Dropping the legacy routes today breaks the panel completely — every screen, not a
feature. **Please tell us before they go**, and we will move first.

Tracked as `F-005` in `docs/testfindings.md`.


---

# I. Deleted accounts

## I1. Showing and restoring a deleted account — asked for on the other page

**The request itself lives in
[`adminweb-tasks-from-backend.md` §6](adminweb-tasks-from-backend.md), not here.**
It is written back onto the page the two teams already pass between them, so the
question sits next to the answers it depends on. This entry exists so that a
reader of *this* file is not left thinking nobody asked.

In one line: an operator wants `DELETED` accounts listed and restorable, and the
panel cannot do any part of it alone. Four separate refusals in `admin-api.md`
stand in the way — `status=DELETED` is a `400`, soft-deleted rows are excluded
from both reads regardless of parameters, `PATCH` cannot set `DELETED` back, and
`USER_DELETED` is neither revertible nor carries any `before` value to restore
from. The one that has to be settled first is whether anonymisation is reversible
at all: if it is not, what is being asked for is "reactivate an anonymised
account" rather than "undo the delete", and it needs to be named that way before
anybody builds it.
---

# J. Serving the panel: headers and indexing

Two things the panel cannot set for itself, both found in a release-readiness audit
on 2026-09-10. Neither is an API change and neither blocks anything today. They are
here because the container in this repository listens on port 80 and something in
front of it terminates TLS — and that something is not in this repository, so we can
neither configure it nor verify it.

## J1. Security headers do not reach the panel's assets

`docker/nginx.prod.conf.template` sets three headers:

```nginx
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "same-origin" always;
```

They are inside `location ${ADMIN_BASE_PATH}`. The block above it,
`location ${ADMIN_BASE_PATH}assets/`, is a **more specific prefix match** and declares
its own `add_header` for caching — and nginx does not inherit `add_header` into a
block that has any of its own. So every JavaScript, CSS and image request, which is
most of the panel's requests, is served with **none of the three**. `/healthz` the same.

**What we would like.** If the reverse proxy in front of this container sets these
headers for the whole host, nothing needs doing and we would like to know that so the
finding can be closed. If it does not, they should be set either there or by repeating
them in the `assets/` block here — we have not made that change because the audit that
found it was explicitly a read of the deployment, not an edit of it.

There is also no `Content-Security-Policy` anywhere in this repository. We are not
asking for one here — it needs a policy decision about what the panel is allowed to
load, and that is a conversation rather than a line of config.

Tracked as `F-052` in `docs/testfindings.md`.

**HSTS and the HTTPS redirect are a separate question and are asked in J3**, because
unlike this one they cannot be answered from our repository at all.

## J2. `robots.txt` needs to be at the domain root, not under `/admin/`

The panel is an internal tool behind a login wall and should not be in a search index.
It now carries `<meta name="robots" content="noindex,nofollow">` in `index.html`, and
we added `public/robots.txt` with:

```
User-agent: *
Disallow: /
```

**That file does not do what it looks like it does on this deployment.** Vite copies
`public/` into `dist/`, and the Dockerfile copies `dist/` to
`/usr/share/nginx/html${VITE_BASE_PATH}` — so it is served at `/admin/robots.txt`, and
a crawler only ever reads `https://<host>/robots.txt`. The meta tag is therefore the
half that actually works, and it only works for a crawler that has already fetched the
page.

**What we would like.** A `robots.txt` at the domain root that disallows at least
`/admin/`. Whether the rest of the host should be disallowed is your call — it depends
on what else is served there, which we do not know. If one already exists, please tell
us what it says so we do not add a conflicting one.

**What must not change:** the panel's own `Disallow: /` file should stay where it is.
It is correct for any deployment served from a root, and removing it would leave only
the meta tag.

Tracked as `F-047` in `docs/testfindings.md`.

## J3. Confirm HTTPS enforcement and HSTS — we cannot check this ourselves

**This is a verification request, not a change request.** We are handing it over rather
than calling it out of scope: it is a real finding on the deployed panel, we simply have
no way to answer it from this repository, and you own the configuration that does.

**Why we cannot answer it.** `docker/nginx.prod.conf.template` — the whole of our web
server config — is `listen 80;` with no TLS listener and no redirect. The container is
published on `127.0.0.1:8081` (`.gitlab-ci.yml`, `scripts/deploy-prod.ps1`) and something
in front of it terminates TLS and serves `https://ratemyprofessor.dev/admin/`. That
something is not in this repository, so from here we can see neither its headers nor its
redirect behaviour.

**Please answer these four, for the host that serves `https://ratemyprofessor.dev/`:**

1. **Is `Strict-Transport-Security` sent on responses?** If yes, please paste the exact
   header value — we need `max-age`, and whether `includeSubDomains` and `preload` are
   on. If no, please say so plainly; "probably" is the answer we cannot record.
2. **Is there an HTTP-to-HTTPS redirect?** That is: does a request to
   `http://ratemyprofessor.dev/admin/` return a `301`/`308` to the `https://` URL, or is
   it served over plain HTTP, or refused?
3. **Which server block are those in?** We are asking for the file and the `server { … }`
   block, so the answer stays checkable later and so we know whether it covers the whole
   host or only some paths. If HSTS is set on a `location` rather than the `server`, that
   matters — `add_header` does not inherit into a block that declares its own, which is
   exactly the bug J1 describes one level down.
4. **Does that same proxy set `X-Content-Type-Options`, `X-Frame-Options` or
   `Referrer-Policy` for the whole host?** If it does, J1 is already covered for our
   assets and we will close it; if it does not, we will fix J1 on our side.

**A curl against the deployed host answers 1, 2 and 4 in one go:**

```bash
curl -sSI https://ratemyprofessor.dev/admin/ | grep -iE 'strict-transport|x-frame|x-content-type|referrer'
curl -sSI http://ratemyprofessor.dev/admin/  | head -1   # expect 301/308 to https
```

**What must not change.** Nothing, on the basis of this item alone. It asks only for an
answer. If the answer is "HSTS is not set", the decision about adding it is yours — an
HSTS header with a long `max-age` is hard to walk back, and it affects every service on
that hostname, not only the admin panel.

Tracked as `F-052` in `docs/testfindings.md`, where it is recorded as handed to you on
2026-09-10 rather than deferred.
