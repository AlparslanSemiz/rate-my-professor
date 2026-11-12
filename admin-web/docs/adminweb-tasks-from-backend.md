# Admin Web tasks

Everything the admin panel repository has to do after the backend split the Admin Web API
from the app API. The full contract is in [admin-api.md](admin-api.md); this page is only
the work list.

**Revised 10 September 2026.** One thing is new since the last version you were sent, and it
changes what you should do first: **tasks 1 and 2 are blocked**, because on the deployed host
`/admin` is not this API. Read the section before task 1. Nothing else on this page moved —
no route, no field and no response shape has changed since the last revision.

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

**Both migration tasks below are blocked on a deployment decision nobody has made yet.** Do not
move any call onto `/admin` until it is made. Everything else on this page is unaffected and
still worth doing.

On `https://8a1babdc-cf6d-4fdc-80a7-dc585f5853ed.ka.bw-cloud-instance.org`, `/admin/` is routed
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

**Two ways out, and it is one decision rather than two changes.**

1. **Serve the panel from a path that does not collide** — `/panel/`, or its own host — and
   leave `/admin/**` to the backend. That is `VITE_BASE_PATH` and the location block in your
   repository, plus the routing rule on the host.
2. **Expose the backend under a prefix of its own** — `/api/**` — and keep `/admin/` for the
   panel. `admin-api.md` already covers this case: `/api` is a proxy prefix, not a backend route
   prefix, and `VITE_API_BASE_URL=/api` is the panel's half of it. Your calls then read
   `/api/admin/auth/login` and so on.

`ADMIN_FRONTEND_ORIGINS` on the backend and `VITE_API_BASE_URL` on your side move with whichever
is chosen. The routing rule itself lives on the deployment host and in none of the three
repositories, which is why we cannot simply ship a fix for it.

- [ ] **Whoever owns the deployment picks 1 or 2, and tells us which.** We will then put the
      resulting paths on this page and in `admin-api.md`, and tasks 1 and 2 unblock. Until then
      the legacy root paths stay served and nothing is deleted — see task 5.

---

## 1. Move the auth calls

**Blocked on the section above.** `POST /admin/auth/login` currently answers `405` from your own
nginx, so shipping this list today locks everyone out. The list stays here because it is still
where you are going, and it is still what closes the two bugs above — it is the timing that has
changed, not the destination.

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

- [ ] **Blocked on the section above — do not do this yet.** Set one base path
      (`https://<host>/admin`) and move the calls above onto it. On the deployment as it stands
      that base path is your own static server, and every call on it would be answered with
      `index.html` or `405`. The table is accurate about the API; it is the host that does not
      route to it yet.

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

Which is a signal that cannot arrive while tasks 1 and 2 are blocked, and that is fine: **the
legacy root paths are not going anywhere.** They are what carries the panel in production today.
Nothing is deleted until the deployment routing is decided, the migration is shipped and this
entry stops appearing — in that order.

---

## 6. From the panel: showing and restoring a deleted account needs four things

**This section is the panel writing back, not the backend writing.** It is here rather than in
`backend-tasks.md` so the question sits on the page the two teams are already passing between
them; `backend-tasks.md` points at it.

**The ask, in one line:** an operator wants deleted accounts to appear in the user listing and
to be restorable. **The panel cannot do any part of this on its own**, and the reason is not
that it has not been built — it is that this API refuses all four of the things it would need.
Measured against `admin-api.md` as it stands on 10 September, not inferred:

1. **`GET /users` refuses the filter.** `status` takes `ACTIVE`, `INACTIVE` or `BLOCKED`;
   `DELETED` is a `400` with `Deleted users are not listed`.
2. **Lifting the filter alone would change nothing.** "Soft-deleted accounts are excluded from
   both reads" — they leave the listing and `404` by id, independently of any parameter. So the
   exclusion and the filter are two separate refusals and both would have to move.
3. **There is no restore, and `PATCH` cannot become one.** `status` accepts `ACTIVE` and
   `BLOCKED`; `DELETED` is a `400`, and the document states the consequence directly: "a deleted
   account cannot be restored — its identifying fields are already scrubbed."
4. **The audit log is not a way back in, and we checked before asking.** The obvious idea is to
   reach a deleted account through the revert machinery the panel already has. It does not
   reach: `USER_DELETED` is not on the eleven-action revertible whitelist, so a revert is refused
   with `ACTION_NOT_REVERTIBLE` before the `TARGET_MISSING` case is ever evaluated. And the
   entry carries nothing to restore *from* — "nothing in the log carries the removed data".
   `changes` is empty for a deletion; there are no `before` values.

### The part that has to be said plainly before anyone builds this

**Soft-delete anonymises, so a restored account's username and e-mail are gone.** Whatever is
built here, the row that comes back is not the account that was deleted: it is that account's
id, warnings and history attached to scrubbed identifying fields. That is a different feature
from "undo the delete", and it should be named differently to whoever asked for it. If we are
wrong about that — if the original values are retained somewhere and only hidden — that single
answer changes the shape of everything below, which is why it is question 6.4 and not a
footnote.

### What is asked for

- [ ] **6.1 — Accept `status=DELETED` on `GET /admin/users`.** Today a `400`. Nothing else about
      the parameter needs to change.
- [ ] **6.2 — Stop excluding soft-deleted rows from that one read, when and only when that
      filter is present.** This is the one with a trap in it, so it is worth being explicit:
      **the default listing must keep excluding them, and `counts.users` must keep excluding
      them.** `admin-api.md` says that counter exists so a "total users" figure does not
      over-report the platform, and the panel's dashboard, its Users stat cards and its
      pagination all read those numbers. A change that widened the default would silently inflate
      every count the panel shows.
- [ ] **6.3 — A way to restore one.** A `POST /admin/users/{id}/restore` would suit the panel
      better than teaching `PATCH` a third status, because restoring is not a field edit and the
      document already gives that as the reason `PATCH` refuses `DELETED`. Whatever shape it
      takes, it needs to say what it does to the anonymised fields and to the revoked sessions.
- [ ] **6.4 — Say whether anonymisation is reversible at all.** If it is not, 6.3 is "reactivate
      an anonymised account" and the panel will say so in the confirmation dialog, in those
      words. If it is, say what comes back and what does not.
- [ ] **6.5 — Say what the audit trail should look like.** A restore is an administrative action
      and the panel would expect it in `/audit-logs`; there is no action for it in the meta
      vocabulary today.

### What the panel would then do, and what it costs

Roughly **half a day**, none of it startable before 6.1–6.4 are answered: a `DELETED` option in
`USER_STATUS_FILTERS` and its guard (both currently `Exclude<UserStatus, 'DELETED'>` with the
refusal quoted in their doc comments), a restore action and mutation with a confirmation that
states plainly what does not come back, the cache invalidation, a Help legend row, MSW handlers,
and rows in the call-surface sweep and the resilience matrix.

Two things the panel will fix on its own regardless of the answer, both recorded as findings:
opening the edit form on a `DELETED` account maps it to `ACTIVE` and would then send
`status: 'ACTIVE'` on save — unreachable today only because the listing excludes such accounts —
and the panel's own copy calls the delete "permanent" and "cannot be undone" while this API
calls it a soft delete plus anonymisation.
