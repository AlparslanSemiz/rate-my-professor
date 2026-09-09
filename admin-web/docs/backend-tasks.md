# Backend tasks — admin panel (`admin-web`)

Hand this file to the backend repository. It holds everything the admin panel
needs from the backend and cannot do itself. Section A is the elevated operator;
section F is the contract gaps the panel still works around. Sections G and H
ask for nothing — they are notices, kept here so that nobody schedules a change on
an assumption this file can correct.

---

# A. Elevated operator for the admin panel

The admin panel has already been changed; this is the part it cannot do itself.

## Goal

`u-kisi4@student.kit.edu` must be able to moderate **other admin accounts**, not
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
  `ADMIN_SUPERUSER_EMAILS=u-kisi4@student.kit.edu`, resolved at bootstrap the same
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

So there is **no backend work here**. The remaining gap is on our side: the panel
still calls the public, active-only reads. It is a small change, but it is a
behaviour change — inactive records start appearing in lists that have never shown
them, the edit form's inactive warning stops being the whole story, and the
All / Active / Inactive filter that was waiting on this becomes possible — so it is
the panel maintainer's call rather than something to slip in.

Tracked as `F-006` in `docs/testfindings.md`. **Please leave both `…/all` routes in
place**; the panel is going to want them.

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

## H1. The panel no longer calls `/activity-logs`

**Nothing is asked for here.** This is recorded only so the endpoint is not
assumed to have a client in this repository.

As of 2026-09-09 the admin panel has no Activity Log screen. It no longer calls
`GET /activity-logs` or `GET /activity-logs/meta`, and its copy of the student
action vocabulary (`USER_LOGIN`, `COMMENT_CREATED`, `RATING_SUBMITTED`,
`LOGIN_REFUSED`, `ACCESS_REFUSED`, …) is gone with it.

**Please do not remove or change those endpoints on our account.** They are
still written to, they remain the record of what students did, and the Android
client or a future panel screen may want them. The audit half — `/audit-logs`,
`/audit-logs/meta` and `/audit-logs/:id/revert` — is unaffected and is still the
panel's only log source.

One consequence worth knowing: `/audit-logs/meta` may still report actor type
`USER` and target types such as `USER_SESSION` and `ENDPOINT`. The panel keeps
accepting all of them and renders whatever it is given, so nothing needs
filtering on the backend side.

`docs/admin-api.md` still lists `/activity-logs/**` in its path-migration table,
which is correct and is not a contradiction of the above: the endpoints move under
`/admin` like everything else, and the panel simply is not one of their clients.

## H2. The panel has not moved to the `/admin` path prefix

**Nothing is asked for here either.** Recorded so that the removal of the legacy
paths is not scheduled on the assumption that we have migrated.

`docs/admin-api.md` states that every administrative route now answers under
`/admin` as well as its old path, and that the legacy paths "are removed once
[the panel] has [moved]". As of 2026-09-09 **the panel has not moved.** It still
calls:

`/auth/request-login`, `/auth/login`, `/auth/logout`, `/auth/me`, `/users/**`,
`/comments/**`, `/answers/**`, `/ratings`, `/reports`, `/audit-logs/**`,
`/system/status`, `/data/lectures`, `/data/professor`.

Dropping the legacy routes today breaks the panel completely — every screen, not a
feature. **Please tell us before they go**, and we will move first.

Tracked as `F-005` in `docs/testfindings.md`.
