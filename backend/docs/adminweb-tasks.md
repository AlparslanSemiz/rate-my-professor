# Admin Web tasks

Everything the admin panel repository has to do after the backend split the Admin Web API
from the app API. The full contract is in [admin-api.md](admin-api.md); this page is only
the work list.

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

---

## 1. Move the five auth calls

- [ ] `POST /auth/request-login` → `POST /admin/auth/request-login`
- [ ] `POST /auth/login` → `POST /admin/auth/login`
- [ ] `POST /auth/logout` → `POST /admin/auth/logout`
- [ ] `POST /auth/logout-all` → `POST /admin/auth/logout-all`
- [ ] `GET /auth/me` → `GET /admin/auth/me`

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

- [ ] Set one base path (`https://<host>/admin`) and move the calls above onto it.

**The two creates change their error shape.** `POST /data/lectures` and
`POST /data/professor` used to check the caller inside the handler and answer
`200 {"success": false}` to a non-administrator. Their `/admin` versions are refused by the
security chain and answer a plain **`403`**. If the panel branches on
`success === false` for these two calls, it needs to handle the status code as well.

- [ ] Handle `403` on the two catalogue creates.

### Three things that deliberately do not move

- **`POST /reports`** — the student's bug submission, app API. `POST /admin/reports` answers
  `404`.
- **The public catalogue reads** — `GET /data/lectures`, `GET /data/lectures/{id}`,
  `GET /data/professor`, `GET /data/professor/{id}`, `GET /data/professor/id`. Keep calling
  them on the app API. The `/admin/data/.../all` listings are the admin-only versions that
  include deactivated rows.
- **`GET /admins/validate`** — legacy and being retired. `GET /admin/auth/me` answers the
  same question with more detail.
  - [ ] Confirm the panel does not call `/admins/validate`, so the backend can delete it.

## 3. Handle a session that ends during the day

Admin sessions are **one day** by default, not a year.

> **While the current experiment runs they are two minutes.** This is deliberate and
> temporary — it is how we watch that a short admin lifetime can no longer reach the app.
> Do not tune the panel around two minutes; build for the one-day value.

- [ ] Read `expiresAt` from the login response. It is a UTC ISO 8601 timestamp naming the
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
