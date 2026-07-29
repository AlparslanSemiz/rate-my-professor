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
| `DELETE /users/{id}` | none | `Deleted user successfully` |
| `PATCH /users/{id}/block` | none | `Student blocked successfully` |
| `PATCH /users/{id}/unblock` | none | `Student unblocked successfully` |
| `POST /users/{id}/warnings` | `{"userID":"ignored","message":"Reason","createdFrom":{"id":"ignored"}}` | `Student warned successfully` |

The target is always the path ID and the actor is always the token principal.
Self and other admin accounts cannot be deleted, blocked, unblocked, or warned.
Repeated block/unblock requests are successful no-ops and create no new audit event.
Delete is a soft delete and revokes the target's sessions.

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

`GET /audit-logs` accepts `limit` (1–100, default 50), opaque `cursor`, `q`,
`actorId`, `action`, `targetType`, and inclusive ISO date-time `from`/`to`.
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

- Actions: `ADMIN_LOGIN`, `ADMIN_LOGOUT`, `USER_WARNING_CREATED`, `USER_BLOCKED`,
  `USER_UNBLOCKED`, `USER_DELETED`, `COMMENT_REPORT_STATUS_CHANGED`,
  `BUG_REPORT_UPDATED`
- Target types: `ADMIN_SESSION`, `USER`, `COMMENT_REPORT`, `BUG_REPORT`

Actor and target display data is copied into each event, so later lifecycle changes do
not make old records unreadable. Domain mutations and audit inserts run in the same
transaction.

## Health

`GET /health` is public and performs `SELECT 1`:

```json
{"message":"API healthy","success":true}
```

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
