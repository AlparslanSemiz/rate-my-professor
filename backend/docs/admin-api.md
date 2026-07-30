# Admin Web API

The service has no global path prefix. All paths below are the complete backend paths.
JSON field names are camelCase, IDs are UUID strings, and response timestamps are UTC
ISO 8601 strings with milliseconds (for example, `2026-07-23T10:30:00.000Z`).

Except for the two login operations and health, the Admin Web endpoints require:

```http
Authorization: Bearer <opaque-token>
```

An absent, invalid, expired, or revoked token returns `401`. A valid non-admin token
returns `403`. Admin role membership comes from the `admins` table, not from the
frontend. Error responses use:

```json
{"message":"Human-readable error","success":false}
```

Validation errors return `400`, missing records `404`, protected admin-account state
conflicts `409`, rate limits `429` with `Retry-After`, unexpected failures `500`, and a
failed database readiness check `503`.

## Authentication

### `POST /auth/request-login`

No authentication. Email is trimmed, lowercased, and must be a
`@student.kit.edu` address.

```json
{"email":"admin@student.kit.edu"}
```

```json
{"message":"Login code sent","success":true}
```

The code is six characters, Argon2-hashed, single-use, and expires after five minutes
by default. Request limits default to 3 per email and 20 per source IP in 15 minutes.
Codes are delivered through SMTP and are never returned or logged.

### `POST /auth/login`

No authentication.

```json
{"email":"admin@student.kit.edu","loginToken":"ABC234"}
```

```json
{
  "message":"Login successful",
  "success":true,
  "authToken":"opaque-random-token"
}
```

The opaque token is returned once; only its SHA-256 hash is persisted. Admin sessions
expire after 12 hours and student sessions after 365 days by default. An eligible email
in `ADMIN_BOOTSTRAP_EMAILS` is provisioned into `admins` after successful OTP
verification. Admin token creation and `ADMIN_LOGIN` audit insertion share one
transaction.

### `POST /auth/logout`

Admin authentication; no body. Revokes the current token and writes
`ADMIN_LOGOUT` in the same transaction.

```json
{"message":"Logged out successfully","success":true}
```

### `POST /auth/logout-all`

Any authenticated user; no body. Revokes every token of the calling account — including
the token used to make the request — so no session of that account passes authentication
afterwards. The account itself is untouched: the user can sign in again with the normal
email + OTP flow. For an admin caller an `ADMIN_LOGOUT` entry is written with
`metadata.scope = "ALL_DEVICES"`.

```json
{"message":"Logged out from all devices (3 sessions)","success":true}
```

A missing or invalid `Authorization` header returns
`401 {"message":"Not logged in","success":false}`.

### `GET /auth/me`

Any authenticated user.

```json
{
  "message":"Authenticated",
  "success":true,
  "user":{
    "id":"uuid",
    "username":"Administrator",
    "kitEmail":"admin@student.kit.edu",
    "role":"ADMIN",
    "status":"ACTIVE"
  }
}
```

The legacy `/auth/validate`, `/account/logout`, and student API contracts remain
available.

## Users

All operations require an admin token. `GET /users` omits soft-deleted users and
includes the authenticated admin:

```json
{
  "message":"Success",
  "success":true,
  "users":[{
    "id":"uuid",
    "username":"Student",
    "kitEmail":"student@student.kit.edu",
    "role":"STUDENT",
    "status":"ACTIVE",
    "joined":"2026-07-23T10:00:00.000Z",
    "lastOnline":"2026-07-23T10:00:00.000Z",
    "biography":"",
    "warnings":0,
    "reports":0
  }]
}
```

`GET /users/{id}` returns that user object directly, without a wrapper.
`warnings` is the persisted warning count; `reports` counts reports against comments
authored by the user.

Mutation endpoints:

| Method and path | Body | Success message |
| --- | --- | --- |
| `PATCH /users/{id}` | any subset of `{"username","kitEmail","biography","status","role","credibilityScore"}` | `Updated user successfully` |
| `DELETE /users/{id}` | none | `Deleted user successfully` |
| `PATCH /users/{id}/block` | none | `Student blocked successfully` |
| `PATCH /users/{id}/unblock` | none | `Student unblocked successfully` |
| `POST /users/{id}/warnings` | `{"userID":"ignored","message":"Reason","createdFrom":{"id":"ignored"}}` | `Student warned successfully` |
| `PATCH /users/{id}/warnings/{warningId}` | `{"message":"Corrected reason"}` | `Updated warning successfully` |
| `DELETE /users/{id}/warnings/{warningId}` | none | `Deleted warning successfully` |

The target is always the path ID and the actor is always the token principal.
Self and other admin accounts cannot be deleted, blocked, unblocked, or warned.
Repeated block/unblock requests are successful no-ops and create no new audit event.
Delete is a soft delete and revokes the target's sessions.

### Editing a user

`PATCH /users/{id}` is how a wrong name, a typo'd address or a stale biography gets
fixed. An omitted field is left alone, an empty body is `400`, and a request that changes
nothing is a successful no-op with no audit event. One `USER_UPDATED` event records every
field that actually changed.

- `username` and `kitEmail` are unique; a collision is `409`. `kitEmail` must be a
  `@student.kit.edu` address and is trimmed and lowercased.
- Changing `kitEmail` **revokes the account's sessions** — the address is the login
  identity, so the old sessions no longer correspond to how the account signs in.
- `status` accepts `ACTIVE` and `BLOCKED`. `DELETED` is `400`: deleting anonymizes the
  account, which is `DELETE /users/{id}` and not a field edit. For the same reason a
  deleted account cannot be restored — its identifying fields are already scrubbed.
- `role` moves the account in and out of the `admins` table. Demoting also revokes its
  sessions, because an admin session outlives a student one and the panel would keep
  working until it expired. Demoting is `409` once the account has moderation history —
  a warning it issued or a report it reviewed points at its `admins` row, and that
  attribution is not thrown away to satisfy a role change.
- Two guards return `409`, both about not locking anyone out of an API with no other
  recovery path: an admin cannot change **its own** status or role, and another admin
  account's `status` is protected exactly as block/unblock/delete protect it. Profile
  fields of an admin account are editable.

`PATCH`/`DELETE /users/{id}/warnings/{warningId}` correct or withdraw a warning that was
already issued. The student is not re-notified: the notification went out when the
warning was created, and rewording it corrects the record rather than warning again. A
warning addressed under the wrong student is `404`.

`GET /users/{id}/warnings` returns:

```json
{
  "message":"Successfully found warnings for student",
  "success":true,
  "warnings":[{
    "userID":"target-user-uuid",
    "message":"Reason",
    "createdAt":"2026-07-23T10:00:00.000Z",
    "createdFrom":{
      "id":"admin-user-uuid",
      "student":null,
      "createdAt":"2026-07-23T09:00:00.000Z"
    }
  }]
}
```

## Comment reports

`GET /comments/reported` returns every report:

```json
{
  "message":"Successfully found all reported comments",
  "success":true,
  "comments":[{
    "id":"report-uuid",
    "commentContent":"Reported comment",
    "postContext":"CS101 — Algorithms",
    "reportText":"",
    "reportedUser":{"id":"uuid","name":"User","role":"STUDENT","warnings":0,"status":"ACTIVE"},
    "reporter":{"id":"uuid","name":"Reporter","role":"STUDENT","warnings":0,"status":"ACTIVE"},
    "reason":"HARASSMENT",
    "status":"OPEN",
    "date":"2026-07-23T10:00:00.000Z"
  }]
}
```

`PATCH /comments/reported/{id}` accepts a `ReportStatus`:

```json
{"status":"REVIEWED"}
```

It returns `{"message":"Updated","success":true}`. An unchanged status is an
audits-free no-op.

## Bug reports

`GET /reports` returns:

```json
{
  "message":"Successfully found all entries",
  "success":true,
  "bugReports":[{
    "id":"report-uuid",
    "title":"Profile upload fails",
    "description":"Description",
    "severity":"HIGH",
    "status":"OPEN",
    "reporterName":"Student",
    "reportedAt":"2026-07-23T10:00:00.000Z"
  }]
}
```

`PATCH /reports/{id}` requires at least one of `status` or `severity`:

```json
{"status":"ACTION_TAKEN","severity":"HIGH"}
```

Only changed fields are persisted. A request changing both fields creates one
`BUG_REPORT_UPDATED` event. `POST /reports` remains the legacy authenticated-student
submission endpoint.

## Audit

This is the activity log: it holds both administrative actions and what users did in
the student app, separated by `actor.type`.

`GET /audit-logs` accepts `limit` (1–100, default 50), opaque `cursor`, `q`,
`actorId`, `actorType`, `action`, `targetType`, and inclusive ISO date-time `from`/`to`.
Results use stable keyset ordering by `(createdAt DESC, id DESC)`. `q` searches the
snapshotted actor name/email and target label case-insensitively.

```json
{
  "message":"Success",
  "success":true,
  "auditLogs":[{
    "id":"audit-uuid",
    "action":"USER_BLOCKED",
    "createdAt":"2026-07-23T10:00:00.000Z",
    "actor":{"type":"ADMIN","id":"uuid","name":"Administrator","email":"admin@student.kit.edu","role":"ADMIN"},
    "target":{"type":"USER","id":"uuid","label":"Student (student@student.kit.edu)"},
    "changes":{"status":{"before":"ACTIVE","after":"BLOCKED"}},
    "metadata":{}
  }],
  "nextCursor":null
}
```

`GET /audit-logs/meta` returns actor snapshots plus these enums:

- Actor types: `ADMIN`, `USER`
- Administrative actions: `ADMIN_LOGIN`, `ADMIN_LOGOUT`, `USER_WARNING_CREATED`,
  `USER_BLOCKED`, `USER_UNBLOCKED`, `USER_DELETED`,
  `COMMENT_REPORT_STATUS_CHANGED`, `BUG_REPORT_UPDATED`
- Student activity: `USER_LOGIN`, `USER_LOGOUT`, `COMMENT_CREATED`, `ANSWER_CREATED`,
  `RATING_SUBMITTED`, `COMMENT_REPORT_CREATED`, `ANSWER_REPORT_CREATED`,
  `BUG_REPORT_CREATED`
- Refusals: `LOGIN_REFUSED`, `ACCESS_REFUSED`
- Target types: `ADMIN_SESSION`, `USER_SESSION`, `USER`, `COMMENT`, `ANSWER`, `RATING`,
  `COMMENT_REPORT`, `ANSWER_REPORT`, `BUG_REPORT`, `ENDPOINT`

`actors` lists admin actors only. Every account that ever signed in appears in the log
as a `USER` actor, so an exhaustive list of those is unbounded; filter students with `q`
or `actorType` instead.

Actor and target display data is copied into each event, so later lifecycle changes do
not make old records unreadable. Domain mutations and audit inserts run in the same
transaction.

### Student activity

Actions performed with a student token are recorded with `actor.type = "USER"` and
`actor.role = "STUDENT"`. `changes` is empty for these — nothing existing is modified —
and `metadata` carries the detail:

```json
{
  "id":"audit-uuid",
  "action":"COMMENT_CREATED",
  "createdAt":"2026-07-23T10:30:00.000Z",
  "actor":{"type":"USER","id":"uuid","name":"Student","email":"student@student.kit.edu","role":"STUDENT"},
  "target":{"type":"COMMENT","id":"comment-uuid","label":"CS101 — Algorithms"},
  "changes":{},
  "metadata":{"contentPreview":"Clear and well paced","contentLength":20}
}
```

`contentPreview` is the first 120 characters of the submitted text; the full body stays
in its own table. `USER_LOGIN` carries `{"method":"EMAIL_OTP","newAccount":<bool>}` and
targets the created session. Votes are not recorded: they carry no content and would
outnumber every other event.

### Refusals

Two kinds of refusal are recorded, both written in their own transaction so that the
record survives the rollback of the request it describes:

| Action | When | `metadata` |
| --- | --- | --- |
| `LOGIN_REFUSED` | `POST /auth/login` answered `403` or `401` | `reason` is `INVALID_CODE` or `ACCOUNT_<status>`, plus `method` |
| `ACCESS_REFUSED` | an authenticated caller was answered `403` | `method`, `path`, `status` |

Only refusals attributable to a known account are recorded. A login attempt for an
address with no account, and an anonymous request answered `401`, have no actor — and
recording them would let anyone fill the table. A failing refusal insert is logged and
swallowed for `ACCESS_REFUSED`, because the documented `403` answer has to hold either
way.

Both recorded login refusals consume the login-failure budget, so a single address
produces at most `app.auth.rate-limit.login-email` of them per window. Once that budget is
spent the endpoint answers `429` and records nothing: that gate consumes nothing itself, so
it answers every request for the rest of the window and one record per refused request
would be unbounded. A blocked account therefore reaches `429` under replay rather than
answering `403` indefinitely.

## System

`GET /system/status` requires an admin token and answers `200` whenever the API is
serving, reporting a failing database in `status` rather than in the HTTP code — a page
that has to show "the API is up but the database is not" cannot do that if the request
itself fails.

```json
{
  "message":"Success",
  "success":true,
  "status":"OK",
  "checkedAt":"2026-07-23T10:30:00.000Z",
  "startedAt":"2026-07-23T09:00:00.000Z",
  "uptimeSeconds":5400,
  "database":{"reachable":true,"latencyMs":3,"error":null},
  "counts":{
    "users":42,
    "admins":6,
    "lectures":12,
    "comments":83,
    "answers":19,
    "ratings":57,
    "openCommentReports":2,
    "openBugReports":1,
    "auditEvents":314
  },
  "lastWrite":{
    "at":"2026-07-23T10:29:48.000Z",
    "ageSeconds":12,
    "action":"USER_BLOCKED",
    "actorName":"Administrator"
  }
}
```

`status` is one of:

- `OK` — the `SELECT 1` probe answered and the counts were read
- `DEGRADED` — the probe answered but a count query failed; `counts` and `lastWrite`
  are `null`
- `DOWN` — the database is unreachable; `database.error` names the failure class and
  `counts`/`lastWrite` are `null`

`counts.users` excludes soft-deleted accounts, matching `GET /users`. `lastWrite` is the
newest audit event and is absent when nothing has been recorded yet; it is what answers
whether an action taken in the panel actually reached the database.

## Health

`GET /health` is public and performs `SELECT 1`:

```json
{"message":"API healthy","success":true}
```

It answers `503 {"message":"API unhealthy","success":false}` when that query fails. This
is the liveness probe for deployment tooling; the admin panel's status page uses
`GET /system/status` instead, which stays `200` so it can render the failure.

## Configuration

Copy `.env.example` and supply deployment-specific values. In production,
`AUTH_RATE_LIMIT_HMAC_KEY` must be an unpredictable value of at least 32 characters,
`ADMIN_BOOTSTRAP_EMAILS` must be explicit, and `ADMIN_FRONTEND_ORIGINS` must contain
only exact comma-separated origins. Wildcards are rejected. SMTP and third-party API
credentials are read only from environment variables.

`ADMIN_FRONTEND_ORIGINS` must list every origin the panel is served from, scheme and
port included. A browser call from an origin outside the list is answered with
`403 Invalid CORS request` before it reaches a controller, so `POST /auth/request-login`
fails and the panel cannot be logged into. An empty value falls back to the local
development origins and logs a warning at startup; it does not disable the check.

The origin has to be listed **even when the panel and the API share it**. The deployed
setup serves the panel under `/admin/` on the same host that proxies this backend, and a
browser still sends `Origin` on every non-`GET` request, same-origin included. The check
looks at that header alone, so a same-origin `POST` is rejected exactly like a
cross-origin one when the list does not contain the host. Confirm a deployment with:

```bash
curl -i -X POST -H "Origin: <panel origin>" -H "Content-Type: application/json" \
  -d '{"email":"nobody@example.invalid"}' <api base>/auth/request-login
```

`400 Invalid KIT email` means the origin is accepted and the request reached the
controller. `403 Invalid CORS request` means it did not.

The Admin Web setting is:

```dotenv
VITE_API_BASE_URL=http://localhost:8080
```

For a reverse proxy that exposes this backend under `/api`, use
`VITE_API_BASE_URL=/api`; `/api` is a proxy prefix, not a backend route prefix.

## Schema management

The backend schema is managed by Spring/JPA. The runtime uses
`spring.jpa.hibernate.ddl-auto=update`, so deployments should point the backend at the
target PostgreSQL database with `SPRING_DATASOURCE_URL`,
`SPRING_DATASOURCE_USERNAME`, and `SPRING_DATASOURCE_PASSWORD`.

Before deploying against an existing database, take a database backup. Hibernate then
applies the additive schema updates required by the current JPA entities when the
backend starts.
