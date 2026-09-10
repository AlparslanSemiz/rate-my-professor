# Admin Web tasks

Everything the admin panel repository has to do after the backend split the Admin Web API
from the app API. The full contract is in [admin-api.md](admin-api.md); this page is only
the work list.

**Revised 10 September 2026.** Two things are new since the last version you were sent, and
neither is a change to the API. **Tasks 1 and 2 are withdrawn** — on the deployed host `/admin`
is your own static server, and the decision has been taken to leave it that way, so the
unprefixed root paths are the production contract permanently. Read the section before task 1.
And the panel's login was broken for a different reason, now fixed in your repository: the
bundle was built with an absolute `VITE_API_BASE_URL`, which made every call cross-origin and
got it `403` on the preflight. It builds with an empty base now, so the calls are same-origin.
Nothing else on this page moved — no route, no field and no response shape has changed since
the last revision.

## What changed, in one paragraph

The session you get now depends on **which login endpoint you called**, not on whether the
account is an administrator. `POST /admin/auth/login` serves administrators only and mints
an administrator session on the admin schedule. `POST /auth/login` is the app API: it mints
an app session that lasts a year for every account, administrators included. Before this,
any administrator logging in from the mobile app inherited the admin lifetime and was
logged out of the app on the panel's schedule.

Alongside that, every administrative route now answers under `/admin` as well as on its old
path. The rule is mechanical: **new path = `/admin` + old path**.

## If you do nothing

Nothing breaks. Every old path still works and `POST /auth/login` still gives an account
with an `admins` row an admin session. The legacy surface is removed only after this list is
done, and the backend will ask before doing it.

The one thing you keep by not moving is a year-long panel session, which is not the policy
the split exists to enforce.

## Two bugs on your board are this migration

Both are on the team's bug list as backend problems. Neither is a backend defect; both are
what "do nothing" costs, so they close when the tasks below are done.

**"No logout after 2 days."** The session lifetime is a property of the **endpoint**, not of
the account or the session type. `POST /auth/login` with no `sessionType` in the body mints
an *administrator* session — which is why every panel screen works — on the **app**
schedule: `AUTH_APP_SESSION_TTL`, a year. `POST /admin/auth/login` mints the same
administrator session on `AUTH_ADMIN_SESSION_TTL`, one day. So the panel is not failing to
log out; it was handed a year. → **Task 1**, and the backend pins both lifetimes in
`AdminApiPathSplitTests`.

**"Signed in as: Unknown User."** Most likely `GET /admins/validate`, which is what the panel
predates the split with. It answers a bare `BasicResponse` — `{"message": "...", "success":
true}` — and carries **no identity at all**: no name, no id, no address. There is nothing in
that response to render, so a panel falling back to a placeholder is the expected outcome
rather than a failure.

`GET /admin/auth/me` is the replacement and carries what the header needs:

```json
{
  "message": "Authenticated",
  "success": true,
  "user": {
    "id": "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
    "username": "ada",
    "kitEmail": "ada@kit.edu",
    "role": "ADMIN",
    "status": "ACTIVE",
    "isSuperAdmin": false
  }
}
```

Read the name from `user.username`. Note `isSuperAdmin` is spelled with the `is` — Jackson
would otherwise have put it on the wire as `superAdmin`. → **Task 1**, last line: there is
no `GET /auth/me` to move off any more, only `GET /admin/auth/me` to move on to.

This second one is an inference from the backend side: we can see what each endpoint returns,
not which one the panel calls. If the panel is already on `/admin/auth/me` and still shows a
placeholder, say so and we will look again — that would be a real backend bug and we would
want it.

---

## Read this before task 1 or task 2 — on the deployed host, `/admin` is your nginx

**Decided on 10 September: tasks 1 and 2 are blocked permanently, not pending anything.** The
deployment keeps `/admin/` for your static container and keeps this backend on its unprefixed
root paths. Do not move any call onto `/admin`. Everything else on this page is unaffected and
still worth doing. The reasoning is below; the observations that produced it are unchanged.

On `https://ratemyprofessor.dev` — and on the bw-cloud hostname, which is the same server —
`/admin/` is routed
to **your** static container, not to this backend. The bundle is built with
`VITE_BASE_PATH=/admin/`, and your `docker/nginx.prod.conf.template` ends its location block in
`try_files $uri $uri/ /admin/index.html` — so every path under `/admin/` is answered with your
`index.html` and the API is never consulted. Observed by curl on 9 September, after that day's
deployment:

| Request | What `admin-api.md` claims | What the deployed host answers |
| --- | --- | --- |
| `GET /health` | `200` JSON | `200 {"message":"API healthy","success":true}` — the backend |
| `GET /auth/me` | `401` JSON | `401 {"message":"Not logged in","success":false}` — the backend |
| `GET /admin/auth/me` | `401` JSON | **`200 text/html`** — your `index.html` |
| `GET /admin/system/status` | `401` JSON | **`200 text/html`** |
| `POST /admin/auth/login` | `400`/`401` JSON | **`405 text/html`** from nginx |

Which layer answered is read off the headers rather than guessed. The `/admin/**` responses
carry `cache-control: no-store`, `x-content-type-options: nosniff`, `x-frame-options: DENY` and
`referrer-policy: same-origin` — the exact set your nginx template writes — while `GET /health`
carries Spring's `vary: Origin`, `pragma: no-cache` and `expires: 0`. The split is made upstream
of both containers rather than inside your nginx: `GET /healthz`, which your nginx answers
`200 ok`, comes back as the backend's `404` JSON. So `/admin/` is handed to you and everything
else goes to the API.

**Nothing is broken today.** Your deployed bundle calls `/auth/me`, `/auth/login`,
`/auth/logout`, `/auth/request-login`, `/users`, `/system/status`, `/audit-logs`, `/ratings`,
`/reports` and `/data/**`, with no `/admin/` prefix anywhere in it. None of those collide.
Carrying out tasks 1 and 2 against this deployment is what would break it: reads would come back
as your own `index.html` and fail to parse, writes would come back `405`, and the whole failure
would read as a backend outage.

This is the same shape as the `GET /auth/me` incident: an assertion that is green in our suite
about a route the deployment shadows. Our tests run this application in-process, where
`/admin/**` maps exactly as `admin-api.md` says. No test on either side can see the proxy in
front of the deployed host, which is why this is written down here rather than pinned.

**Three ways out were on the table, and the third was taken.**

1. **Serve the panel from a path that does not collide** — `/panel/`, or its own host — and
   leave `/admin/**` to the backend. That is `VITE_BASE_PATH` and the location block in your
   repository, plus the routing rule on the host.
2. **Expose the backend under a prefix of its own** — `/api/**` — and keep `/admin/` for the
   panel. Your calls would then read `/api/admin/auth/login` and so on.
3. **Change nothing about the routing.** You keep `/admin/`, we keep the unprefixed root paths,
   and the `/admin/**` API routes stay shadowed on this host.

- [x] **Decided on 10 September: option 3.** What forced it was a different bug. Your bundle was
      built with an absolute `VITE_API_BASE_URL` pointing at the bw-cloud hostname, so the
      browser was making a cross-origin call from `https://ratemyprofessor.dev`, and this
      backend answered `403` on the preflight — nobody could log in at all. The fix was to build
      with an **empty** base so your calls go out same-origin, which works only because the host
      already routes everything outside `/admin/` here unchanged. Option 2 would have required
      the opposite: a new prefix-stripping rule on a host whose nginx config is version
      controlled in none of the three repositories. Option 1 would have meant moving your served
      path and breaking every bookmark. Option 3 costs one line in your CI and no host change,
      and it is what is deployed.

**What that means for this page.** Tasks 1 and 2 do not unblock later; they are withdrawn. The
legacy root paths are the contract in production, permanently, and nothing on them is deleted —
see task 5. `admin-api.md` still documents the `/admin/**` twins because they exist in the
application and the suite exercises them; on this deployment they are unreachable, and that is
now by design rather than by accident.

Nor does `ADMIN_FRONTEND_ORIGINS` matter to you any more. A same-origin caller never reaches the
CORS check, which was measured rather than assumed: with the list holding neither host, a
preflight carrying `Origin: https://ratemyprofessor.dev` to that same host answers `200`, while
one carrying `Origin: https://evil.example.invalid` answers `403`. Keep the base empty and CORS
is simply not in your path.

---

## 1. Move the auth calls

**Withdrawn — see the section above.** `POST /admin/auth/login` answers `405` from your own
nginx on this deployment, so shipping this list would lock everyone out. The list stays on the
page because it is an accurate description of the API and of what the `/admin/**` twins do; it
is no longer where you are going. The two bugs it used to close are handled on the root paths
instead, which is where task 5 keeps them.

- [ ] `POST /auth/request-login` → `POST /admin/auth/request-login`
- [ ] `POST /auth/login` → `POST /admin/auth/login`
- [ ] `POST /auth/logout` → `POST /admin/auth/logout`
- [ ] `POST /auth/logout-all` → `POST /admin/auth/logout-all`
- [ ] `GET /auth/me` → `GET /admin/auth/me`

  **This line used to say the old path was gone and not coming back. It was right about the
  code and wrong about the consequence, and it cost you the panel.** `GET /auth/me` really was
  unmapped, and your own reading (C-01) had the effect exactly: `authenticateAdmin.ts:32-42`
  bare-catches the `404`, hands `null` to `resolveAdminUser`, and fails the whole sign-in with
  "your admin account could not be read". The code was accepted, the token was minted, and
  nobody could get in. Neither side saw it, because from here it looks like a retired route and
  from there it looks like a flaky backend.

  `GET /auth/me` is **served again** as of `CHANGELOG` 9.09 (15), answering exactly what
  `GET /admin/auth/me` answers and requiring the same admin session. You need to ship nothing
  to sign in again. It exists only until you have migrated, and `AdminApiPathSplitTests` pins
  the two paths to the same answer in the meantime.

Do `POST /admin/auth/login` first — it is the one that changes behaviour:

- An account without an `admins` row is refused with **`403 Admin access required`**. It
  used to receive a student session and then collect `403`s on every panel screen.
- A `sessionType` field in the body is **ignored**. You can drop it. It still works on the
  app API, so sending it costs nothing while you are mid-migration.
- The response carries a new field, `expiresAt` — see task 3.

## 2. Move every other call

New path = `/admin` + old path.

| Old | New |
| --- | --- |
| `/users/**` | `/admin/users/**` |
| `/comments/**` | `/admin/comments/**` |
| `/answers/**` | `/admin/answers/**` |
| `GET /ratings`, `DELETE /ratings/{id}` | `GET /admin/ratings`, `DELETE /admin/ratings/{id}` |
| `/audit-logs/**` | `/admin/audit-logs/**` |
| `/activity-logs/**` | `/admin/activity-logs/**` |
| `GET /system/status` | `GET /admin/system/status` |
| `GET /data/lectures/all`, `GET /data/professor/all` | `/admin/data/lectures/all`, `/admin/data/professor/all` |
| `PATCH`/`DELETE /data/lectures/{id}` | `/admin/data/lectures/{id}` |
| `PATCH`/`DELETE /data/professor/{id}` | `/admin/data/professor/{id}` |
| `POST /data/lectures` | `POST /admin/data/lectures` |
| `POST /data/professor` | `POST /admin/data/professor` |
| `GET /reports`, `PATCH`/`DELETE /reports/{id}` | `/admin/reports`, `/admin/reports/{id}` |
| `POST /reports/{id}/gitlab-issue` | `POST /admin/reports/{id}/gitlab-issue` |

- [ ] ~~Set one base path (`https://<host>/admin`) and move the calls above onto it.~~
      **Withdrawn — see the section above.** That base path is your own static server on this
      deployment, and every call on it would come back as `index.html` or `405`. The table stays
      because it is accurate about the API; it is the host that will not route to it, and that
      is now the settled arrangement rather than a temporary one.

**The two creates answer `403`.** `POST /data/lectures` and `POST /data/professor` are both
refused by the security chain with a plain **`403`** when the caller is not an administrator,
and so are their `/admin` versions. `POST /data/professor` used to check the caller inside
the handler and answer `200 {"success": false}` instead; that is fixed, so the legacy and
`/admin` paths no longer differ in error shape. If the panel branches on
`success === false` for these two calls, it needs to handle the status code as well.

- [x] ~~Handle `403` on the two catalogue creates.~~ **Does not apply to this repository.**
      Your audit (§3.7) establishes that the panel calls neither `POST /data/lectures` nor
      `POST /data/professor` — `LectureCatalogService` and `ProfessorCatalogService` implement
      only the read, the patch and the delete, and the catalogue UI offers no create control.
      Closed from our side.

### Three things that deliberately do not move

- **`POST /reports`** — the student's bug submission, app API. `POST /admin/reports` answers
  `404`.
- **The public catalogue reads** — `GET /data/lectures`, `GET /data/lectures/{id}`,
  `GET /data/professor`, `GET /data/professor/{id}`, `GET /data/professor/id`. Keep calling
  them on the app API. The `/admin/data/.../all` listings are the admin-only versions that
  include deactivated rows.
- **`GET /admins/validate`** — legacy and being retired. `GET /admin/auth/me` answers the
  same question with more detail.
  - [x] Confirmed from your audit: the panel does **not** call `/admins/validate`. The route is
        still here — deleting it is a separate decision, tracked on our board — but the question
        is answered and nothing is waiting on you.

## 2a. Two fields the ratings tab reads that this API has never served

Found by `ConsumerContractSweepTests`, which checks every field your contract says you read
against the response the route actually returns. These two were its first run's only real
finds, and both are silent by construction — your own null-guards turn them into wrong data
rather than an error.

`GET /ratings` serves each rating as:

```json
{"id":"...","student":{"id":"...","name":"...","role":"STUDENT","warnings":0,"status":"ACTIVE"},
 "lectureLabel":"CS101 — Algorithms","lectureId":"...",
 "topics":[{"category":"LECTURE_UNDERSTANDABILITY","value":4.5}],"createdAt":"..."}
```

- [ ] `src/api/catalog/ratingMapper.ts:19` reads `rating.author?.name`. The field is
      **`student`**. Because the read is optional-chained with a fallback, **every row of the
      ratings table shows "Unknown"** instead of failing.
- [ ] `ratingMapper.ts:21` reads `rating.scores ?? {}`. The field is **`topics`**, and it is a
      list of `{category, value}` rather than an open map. **The scores column is empty on
      every row.**

Neither is a backend change: `admin-api.md` has documented `student` and `topics`, with the
worked example above, since the endpoint existed. Both are now pinned in
`ConsumerContractSweepTests.READ_BUT_NOT_SERVED`, and that list is asserted as an exact set —
so when you fix the mapper and update your contract document, our build goes red and the entry
gets deleted. That is deliberate: it is how we find out.

## 2b. Deactivating a lecture or professor hides it from your only list — F-42

Not a backend defect, and not a field name this time: it is which of two routes you read.

`GET /data/lectures` and `GET /data/professor` filter to `active = true`. That is what they
are for — the app must not show a retired lecture. **The panel reads only those two**, so when
an administrator sets `active: false` from the catalogue form the row leaves the list and there
is no screen left that can see it. The `PATCH` that would set it back needs the id, and the id
is only on the row that has just disappeared.

The pair that exists for exactly this already answers:

- [ ] Read `GET /data/lectures/all` and `GET /data/professor/all` on the catalogue screen —
      `/admin/data/lectures/all` and `/admin/data/professor/all` once task 2 is done. They
      return active and inactive rows, and every row carries `active`.
- [ ] Add an **All / Active / Inactive** filter over that list, defaulting to Active so the
      screen looks the way it does today. Inactive is the view that does not exist yet, and it
      is the one that makes `PATCH {"active": true}` reachable.

Nothing is lost when a row is deactivated, which is worth being precise about: the row keeps its
id, its ratings and its comments, and `PATCH {"active": true}` restores it. The problem is only
that the id is no longer on any screen you have, so there is nothing to aim the `PATCH` at.

Your own contract document records `/data/lectures/all` and `/data/professor/all` as **"Not
called. The panel deliberately reads the active-only public endpoints instead."** That was a
reasonable choice while nothing could deactivate a row; the catalogue form is what changed it.
Neither side is wrong on its own — this is a gap between two sensible decisions, which is why no
test on either side sees it.

**Until this is done, treat the `active` switch as one-way in the panel.** The backend can
reverse it, but only through a request the panel does not currently make.

**Scheduling:** this is agreed for the admin panel's deferred list, to be picked up **after
submission**. Until then it is a known limitation rather than an open bug.

## 3. Handle a session that ends during the day

Admin sessions are **one day** by default, not a year.

- [ ] Read `expiresAt` from the login response. **Still open** — your audit (C-13) confirms
      `expiresAt` appears nowhere in `src/`, and `TokenLoginService.ts:23-27` reads exactly one
      field off the login response, `authToken`. The field is served and has been since the
      split. It is a UTC ISO 8601 timestamp naming the
      moment the token stops authenticating.
- [ ] Warn before it expires, rather than letting an operator discover it as a `401` in the
      middle of a form. Losing a half-typed warning body to a silent expiry is the failure
      this field exists to prevent.
- [ ] On any `401`, send the operator back to login and drop the stored token.

## 4. Keep reading state, not re-deriving it

Unchanged, but worth repeating while you are touching these calls: `revertible`,
`revertBlockedReason`, `gitlabEnabled` and the refusal reasons are computed by the server on
every read. Render them; do not reimplement the rule behind them. Two copies of the revert
window drift apart, and the copy in the panel is the one that will be wrong.

## 5. Tell the backend when you are done

Every `ADMIN_LOGIN` audit entry now carries `metadata.api`, naming the endpoint the session
came from. An entry with `"api": "APP"` is a panel that still logs in through `/auth/login`.

- [ ] When no new `ADMIN_LOGIN` entry carries `"api": "APP"`, say so. That is the signal the
      backend waits for before deleting the legacy paths, the `sessionType` field and
      `GET /admins/validate`.

Which is a signal that cannot arrive now that tasks 1 and 2 are withdrawn, and that is fine:
**the legacy root paths are not going anywhere.** They are what carries the panel in production,
and under the decision recorded above they are what will carry it. Nothing on them is deleted.

## 6. Deleted accounts — answer to your §6 / backend task I1

**Nothing here is implemented and no public behaviour has changed.** This section is the
measurement you asked for plus three options, so the decision is taken with the real numbers
rather than from what the documentation claims. Two of your two source documents
(`adminweb-tasks-from-backend.md`, `backend-tasks.md`) are not in this repository, so the four
obstacles below were read out of the code, not out of them.

### What is actually in the way

**1. `status=DELETED` is refused deliberately, and by one line.**
[`UserListQuery.java:65-67`](../src/main/java/com/pse/moderation/service/user/UserListQuery.java#L65-L67)
throws `400 "Deleted users are not listed"`. The stated reason is in the comment above it: the
filter could only ever return an empty page, because the exclusion below is unconditional, and
an empty page reads as *"there are no deleted accounts"* — a wrong answer that looks like a
right one. So the refusal is not protecting anything; it is honesty about the exclusion. Remove
the exclusion and the refusal has no reason left.

**2. The exclusion is in the query, not in the service, and it is in two places.**
- Listing: [`UserDirectoryService.java:119`](../src/main/java/com/pse/moderation/service/user/UserDirectoryService.java#L119) —
  a `notEqual(status, DELETED)` predicate added unconditionally to every specification.
- Single read: [`UserDirectoryService.java:188`](../src/main/java/com/pse/moderation/service/user/UserDirectoryService.java#L188) —
  `findByIdAndStatusNot(id, DELETED)`, so `GET /users/{id}` on a deleted account is `404`.
- Every mutating user route is closed too, one layer up:
  [`ModeratedStudents.findMutable:70-72`](../src/main/java/com/pse/moderation/service/user/ModeratedStudents.java#L70-L72)
  turns a deleted target into `404` before block, unblock, delete, warn or `PATCH` ever run.

That third one matters for option B: **there is currently no route through which a deleted
account can be modified at all**, so a restore is a new endpoint, not a parameter.

**3. What the scrub destroys, exactly.**
[`StudentLifecycleService.deleteStudent:85-93`](../src/main/java/com/pse/moderation/service/user/StudentLifecycleService.java#L85-L93):

| Field | After deletion | Recoverable? |
| --- | --- | --- |
| `username` | `Deleted user <first 8 of uuid>` | only from `audit_logs.target_label` |
| `kitEmail` | `deleted-<uuid>@invalid.local` | only from `audit_logs.target_label` |
| `biography` | `""` | **no — no copy exists anywhere** |
| `blockedReason` | `null` | **no** |
| `status` | `DELETED` | yes, `before` is in the audit changes |
| `deletedAt` | set | — |
| `id`, `createdAt`, `credibilityScore`, `emailVerifiedAt`, every relation | untouched | yes |

The row is never deleted, which is why comments, answers, votes, ratings, warnings and reports
keep valid foreign keys. **The single surviving copy of the identity is
`audit_logs.target_label`**, written as `"username (kitEmail)"` by
[`UserResponseMapper.label`](../src/main/java/com/pse/moderation/mapper/UserResponseMapper.java#L139-L141)
**before** the scrub — and `audit_logs` has no foreign key to `students` and no retention or
pruning job anywhere in `src/main`, so it survives indefinitely.

**You can therefore build a read-only "deleted accounts" list today with no backend change at
all**: `GET /audit-logs` filtered to `action=USER_DELETED` gives you the id (`target.id`), the
real identity (`target.label`), the timestamp and the acting admin. That covers the *visibility*
half of your request for admin-initiated deletions, right now. It does not cover self-deletions —
see the finding below.

**4. `USER_DELETED` is not revertible, and it is blocked twice over.**
It is absent from `REVERTIBLE_ACTIONS`
([`AuditRevertService.java:52-64`](../src/main/java/com/pse/audit/revert/AuditRevertService.java#L52-L64)),
and independently of that its `changes` map carries the lifecycle keys `exists` and `anonymized`,
which `isFieldDiff` rejects on sight
([`AuditRevertService.java:293-297`](../src/main/java/com/pse/audit/revert/AuditRevertService.java#L293-L297)).
Adding the action to the set alone would change nothing. And the `before` values it carries are
only `status: BLOCKED|ACTIVE`, `exists: true`, `anonymized: false` — **no `username`, no
`kitEmail`, no `biography`**. Confirmed by the assertion in
`StudentLifecycleServiceTests.deleteStudent_recordsTheChangeAsALifecycleEventSoItCannotBeReverted`.
The generic revert machinery cannot restore an identity it was never given.

### A defect found while measuring — F-46, opened, not fixed

**There are two different soft-deletes, and only one of them anonymises.**
`PATCH /account/deleteAccount` (the app's own) goes through
[`StudentService.softDeleteByKitEmail:205-214`](../src/main/java/com/pse/user/service/StudentService.java#L205-L214),
which sets `status = DELETED` **and nothing else** — no scrub, no `deletedAt`, and **no audit
entry at all**. Consequences that bear directly on this request:

- A self-deleted account is invisible to you *and* absent from the audit log, so the
  audit-log workaround above does not see it. Your list would be admin-deletions only.
- Because its `kitEmail` is intact, [`LoginCodeService.java:76-79`](../src/main/java/com/pse/auth/service/LoginCodeService.java#L76-L79)
  flips it back to `ACTIVE` when a login code is requested for that address. **Undelete already
  exists, unaudited and uncontrolled** — for exactly the accounts you cannot see. No test pins
  that branch.
- Admin-deleted accounts are not affected: their address is scrubbed to `@invalid.local`, so the
  lookup misses and a re-registration makes a fresh row.

Recorded in `docs/TODO.md` row 36. Not fixed in this pass, per instruction.

### The three options

Estimates are backend work including tests and documentation. **Client-visible** means a
`CHANGELOG` entry is mandatory in the same commit.

---

**Option A — make deleted accounts visible. Recommended.**

Allow `status=DELETED`, and make the listing exclusion conditional so the default stays exactly
as it is (excluding), because every count the panel renders depends on that default.

- **Changes:** drop the refusal at `UserListQuery.java:65-67`; make the predicate at
  `UserDirectoryService.java:119` conditional; optionally relax `:188` to `findById` so a
  detail page can open. **2 files** in `src/main` (3 with the detail page). No schema change.
- **Tests to invert, not delete:** `UserDirectoryServiceTests:101-109` and
  `AdminApiIntegrationTests:2501-2504` both pin the `400`.
  `AdminApiIntegrationTests.deletedAccountsAreExcludedFromTheListingAndItsCount:2510-2527`
  stays green — the default does not change — and gains one assertion for the new filter.
- **Docs:** `admin-api.md:258`, `:272`, `:309`; `CHANGELOG`.
- **Client-visible:** yes. A documented `400` becomes a `200`.
- **Estimate:** ~2 hours.
- **What you actually see:** id, join date, `DELETED` status, credibility score, warning and
  report counts, the placeholder avatar — and `Deleted user 7c9e6679` /
  `deleted-…@invalid.local` where the identity was. **Pair it with the `USER_DELETED` audit
  entry to put a real name on the row.** That pairing is the whole feature.

---

**Option B — flip the status back. Do not do this.**

Mechanically small: a `POST /users/{id}/restore` that sets `ACTIVE`. It is the product answer
that is wrong, and this is the question you asked me to answer honestly.

A restored account comes back with its id, every relation, its credibility and its join date —
and with `username = "Deleted user 7c9e6679"` and `kitEmail = "deleted-…@invalid.local"`. It is
an **active account that nobody can identify and that its owner cannot log into**, because no
one receives mail at `@invalid.local`. It would sit in your user list looking healthy. That is
worse than leaving it deleted: it is a row that lies about its own state. Its ratings would also
re-enter every lecture and professor average
([`RatingAverages.java:83-87`](../src/main/java/com/pse/rating/service/RatingAverages.java#L83-L87),
[`LectureResponseMapper.java:71-75`](../src/main/java/com/pse/lecture/mapper/LectureResponseMapper.java#L71-L75)),
silently moving numbers the app has already shown.

**Recovering the identity from `audit_logs.target_label` does not rescue it.** That column is a
display string, `"username (kitEmail)"`; splitting it back into two fields is parsing a formatted
message to recover typed data, which is the shape this repository has already been burned by
(F-4). It breaks on any username containing `" ("`, it cannot restore the biography at all — no
copy exists — and re-applying the original address can collide with the `unique` constraint on
`kit_email` if anyone re-registered with it in the meantime.

- **Estimate if built anyway:** ~4 hours, and it buys a misleading feature.
- **Client-visible:** yes, new route and new `USER_RESTORED` audit action.

---

**Option C — split deletion from anonymisation. The only route to a real undo.**

Mark `DELETED` immediately; anonymise after a grace window. Restore inside the window is then a
genuine restore, because nothing has been destroyed yet.

- **Schema:** a new `students.anonymized_at` column. This repository keeps **twin baselines**
  (ADR-0004): `src/main/resources/db/migration/postgresql/V1__…sql` and
  `src/test/resources/db/migration/h2/V1__…sql`. Both move, by hand.
- **New infrastructure:** something must run the delayed scrub. **There is no `@Scheduled` and no
  `@EnableScheduling` anywhere in `src/main`** — this would be the first, which is a new test
  question (what layer tests a job that fires on a clock?) as well as new code.
- **Main changes:** `StudentLifecycleService.deleteStudent` (stop scrubbing, record a real
  before-diff), the anonymisation job, `ModeratedStudents.findMutable` (a restore route needs a
  way past its `404`), a new restore endpoint and controller, `AuditAction` (`USER_RESTORED`),
  `LoginCodeService:76` — F-46 becomes *far* more dangerous here, because during the window the
  real address is still in the table and that branch would silently resurrect accounts.
  **~6 files plus 2 migrations plus a new controller.**
- **Tests to invert:** `StudentLifecycleServiceTests.deleteStudent_anonymisesTheAccountRatherThanRemovingIt`,
  `…recordsTheChangeAsALifecycleEventSoItCannotBeReverted`, `…recordsTheIdentityTheAccountHadBeforeTheScrub`
  (becomes trivially true and should say so), the two `400` tests from option A, plus the
  `USER_DELETED` cases in `AuditRevertServiceTests:137` and `:487-494`, plus
  `AdminApiIntegrationTests:2702-2723`.
- **The part that is not an engineering cost:** for the length of the window the account is
  *not* anonymised. Real names and real addresses stay in the table after a user has asked for
  deletion. For a KIT project that is a data-protection posture decision, and it belongs in an
  ADR with your name on it, not in a commit message.
- **Estimate:** 1.5–2 days, and an ADR.
- **Client-visible:** yes, extensively.

---

### Decided 10 September: option A, paired with the audit log

**Option A is implemented and is in this repository.** Option B is refused — it is the cheapest
and the only one that produces a screen that lies. Option C is a standing decision, not a
backlog item: it is written up and declined in
[ADR-0015](adr/0015-deletion-not-split-from-anonymisation.md), so nobody revives it from an
options list alone.

### What you get, and what you have to do

**Backend, done — one filter.** `GET /users?status=DELETED` now answers `200` with the
soft-deleted accounts instead of `400 "Deleted users are not listed"`. It is in the `CHANGELOG`
under `10.09 (18)`.

**Backend, done — the profile modal opens too.** `GET /users/{id}` and
`GET /users/{id}/warnings` both answer `200` for a soft-deleted account instead of `404`.
`CHANGELOG` `10.09 (19)`. So a row on the new list is clickable and the modal renders: the
anonymised account, and its full warning history.

**They opened together because your own code says they had to.** Your `fetchProfile` reads both
in one pass and its shared `NotFoundError` branch renders the whole profile as "account gone"
when *either* answers `404` (`useUserProfile.ts:24-32`). Opening only the account read would have
changed the contract and left your modal saying exactly what it says today. That is recorded, and
where it came from is recorded with it — see the note at the end of this section.

**`404` has not gone away, and this is the part not to misread.** It now says one thing instead of
two. An id that names **no row** is still `404` on both routes. An id that names a **soft-deleted
row** is `200`. Before this, `404` answered both "no such account" and "that account was deleted"
and you had no way to tell them apart; now you do. Both halves are pinned by
`AdminApiIntegrationTests.aDeletedAccountIsReadableWithItsWarningsAndAnUnknownOneIsStillNotFound`.

**Nothing else moved, on purpose.** An unfiltered `GET /users` still excludes deleted accounts,
and so does a filter for any other status — your account counts come off this listing and
counting anonymised rows would over-report the platform. `status=DELETED` is the only thing that
reaches them. And all of it is **read-only**: every mutating route still answers `404` for a
deleted account, because `ModeratedStudents.findMutable` refuses one before block, unblock,
delete, warn or `PATCH` ever runs. There is no restore, by decision.

**Panel side — the row you get is anonymised.** It carries `id`, `joined`, `status: "DELETED"`,
`credibilityScore`, `warnings`, `reports`, and `Deleted user 7c9e6679` /
`deleted-…@invalid.local` where the identity was. Rendering that on its own is a screen that
says an account was deleted and cannot say whose.

### Putting the identity back: `GET /audit-logs?action=USER_DELETED`

**This needs no backend change.** It works today, and it worked before option A shipped.

Every admin deletion writes a `USER_DELETED` entry, and the entry is built **before** the scrub
runs ([`StudentLifecycleService.java:71-73`](../src/main/java/com/pse/moderation/service/user/StudentLifecycleService.java#L71-L73)).
`audit_logs` has no foreign key to `students` and there is no retention or pruning job anywhere
in `src/main`, so the entry outlives the account indefinitely. From one entry you get:

| Field | What it carries |
| --- | --- |
| `target.id` | the account id — **this is your join key** to the `status=DELETED` row |
| `target.label` | the real identity the account had, as `"username (kitEmail)"` |
| `createdAt` | when it was deleted |
| `actor.name`, `actor.email` | which administrator deleted it |

Join on `target.id` and the screen becomes truthful: *this account existed, this was its name,
this admin deleted it on this date, its content is still here.*

### `target.label` is a display string. Render it; do not parse it.

It is one field that happens to read as two, and the temptation to `split(' (')` it into a name
and an address is the reason this paragraph exists. **Do not.**

- It is **not a contract of two fields.** It is `username + " (" + kitEmail + ")"`, built by one
  mapper for humans to read, and nothing anywhere guarantees that shape survives. Other writers
  build labels like `"Comment by ada"` and `"Report about ada"` into the same column.
- It **breaks on real data.** Any username containing `" ("` splits in the wrong place, and
  usernames are user-supplied.
- **This repository has already been burned by exactly this shape.** F-4: a test let a matcher
  throw and then regex-parsed the exception's *message* to recover the failing field, while the
  same library exposed the typed values the whole time. Parsing a formatted string to recover
  data that was typed before someone formatted it is the shape, and this is the same shape.

If you need the name and the address as separate fields, **say so and we will add them to the
audit entry as typed values** — that is a backend change, cheap, and the right place for it. It
is not a change you can make safely on your side by splitting a string.

### What this still does not cover — F-46

The pairing above sees **admin deletions only**. An account that deleted itself through the
app's `PATCH /account/deleteAccount` writes **no audit entry at all** and is not anonymised, so
it appears in your new `status=DELETED` list carrying its real name — with nothing in the audit
log explaining when or why it went. Worse, because its address is intact, requesting a login
code for it silently flips it back to `ACTIVE`.

That is F-46, recorded in `docs/TODO.md` and **deliberately not fixed before submission** — it
touches the account lifecycle. Two consequences for your screen, both worth knowing before you
build it:

- A `DELETED` row **with a real username** is a self-deletion, not an admin deletion. It will
  have no matching `USER_DELETED` entry. Do not render the missing entry as an error.
- A row can leave the list on its own, without any admin action, if its owner signs in again.

### One note worth keeping, about how this was decided

The backend was asked whether to open the single read as well, and the question was answered
**out of `adminweb-consumer-contract.md`** rather than out of the backend: that document records
that your `fetchProfile` reads the account and its warning history together and collapses a `404`
from either into one "account gone" branch. That is what showed the two routes had to move as a
pair, and what ruled out the third option on the table — opening `GET /users/{id}` alone, which
would have spent a contract change and fixed nothing on your screen.

**This is the first time the consumer contract document changed a backend decision directly**,
which is the thing it was written for ([ADR-0013](adr/0013-consumer-expectations-in-the-backend-repo.md)).
Recorded here rather than only in the worklog because it is your document's win as much as ours.
