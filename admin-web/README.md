# Admin Web

React + TypeScript + Vite admin console.

## API Configuration

Vite reads `VITE_API_BASE_URL` at build/start time.

Local development:

```env
VITE_API_BASE_URL=http://localhost:8080
```

## Local Mock DB + Admin Web

This repo owns the local mock flow for admin development: Postgres, seeded demo data, and a small mock API that serves the admin panel endpoints.

Default local database connection:

```text
postgresql://admin_web:admin_web@localhost:5432/admin_web
host:     localhost
port:     5432
database: admin_web
username: admin_web
password: admin_web
```

You can change these defaults in `.env.docker`.

Start the complete Docker stack:

```bash
npm run docker:up
```

Then open:

```text
http://localhost:5173
```

The Docker web image is built with `VITE_API_BASE_URL=/api`. Nginx proxies
`/api/*` to the mock API container, so Audit Logs and the other admin endpoints
never fall back to the remote production backend.

Container ports:

```text
web:      http://localhost:5173
mock API: http://localhost:8080
Postgres: localhost:5432
```

Demo login:

```text
email: u-kisi4@student.kit.edu
code: 123456
```

Stop the full stack:

```bash
npm run docker:down
```

For host-based development with Vite hot reload, start the DB and mock API:

```bash
npm run mock:up
```

Then run the web app in a second terminal:

```bash
npm run dev:local
```

Production deploy build:

```env
VITE_API_BASE_URL=https://server.example.org
```

The login flow stores `/auth/login` response field `authToken` and sends it on authenticated admin requests:

```http
Authorization: Bearer <authToken>
```

All endpoints except `GET /health`, `POST /auth/request-login`, and
`POST /auth/login` require an `Authorization: Bearer <authToken>` header for an
admin user.

Auth:

- `POST /auth/request-login` with `{ "email": "user@student.kit.edu" }`
- `POST /auth/login` with `{ "email": "user@student.kit.edu", "loginToken": "123456" }`
- `POST /auth/logout` (revokes the bearer token)
- `GET /auth/me`

Users:

- `GET /users`
- `GET /users/:id`
- `DELETE /users/:id`
- `PATCH /users/:id/block`
- `PATCH /users/:id/unblock`
- `GET /users/:id/warnings`
- `POST /users/:id/warnings` with `{ "message": "..." }`

Comments:

- `GET /comments/reported`
- `PATCH /comments/reported/:id` with `{ "status": "..." }`

Bug reports:

- `GET /reports`
- `PATCH /reports/:id` with `{ "status": "...", "severity": "..." }`

Audit logs:

- `GET /audit-logs?limit=50&cursor=&actorId=&action=&targetType=&q=&from=&to=`
- `GET /audit-logs/meta`

Audit list responses use an opaque `nextCursor` and return immutable actor/target
snapshots so entries remain readable after the source record is deleted:

```json
{
  "success": true,
  "message": "Success",
  "auditLogs": [
    {
      "id": "abababab-1111-1111-1111-111111111111",
      "action": "USER_BLOCKED",
      "createdAt": "2026-07-23T10:00:00.000Z",
      "actor": {
        "type": "ADMIN",
        "id": "11111111-1111-1111-1111-111111111111",
        "name": "Alparslan",
        "email": "u-kisi4@student.kit.edu",
        "role": "ADMIN"
      },
      "target": {
        "type": "USER",
        "id": "33333333-3333-3333-3333-333333333333",
        "label": "JonasB (jonas@student.kit.edu)"
      },
      "changes": {
        "status": { "before": "ACTIVE", "after": "BLOCKED" }
      },
      "metadata": {}
    }
  ],
  "nextCursor": null
}
```

Supported actions are `ADMIN_LOGIN`, `ADMIN_LOGOUT`,
`USER_WARNING_CREATED`, `USER_BLOCKED`, `USER_UNBLOCKED`, `USER_DELETED`,
`COMMENT_REPORT_STATUS_CHANGED`, and `BUG_REPORT_UPDATED`. The mock API writes
each successful state change and its audit event in the same database
transaction. The production backend is not part of this repository and must
implement the same contract for the deployed web application to receive audit
data.

Health:

- `GET /health`

## Scripts

```bash
# App
npm run dev              # Vite dev server
npm run dev:local        # Vite against the local mock API (demo-local mode)
npm run build            # Type-check and build for production
npm run preview          # Preview the production build

# Complete Docker stack
npm run docker:up        # Build and start web + mock API + Postgres
npm run docker:down      # Stop and remove the complete stack
npm run docker:logs      # Follow logs from all stack services

# Quality
npm run check            # lint + typecheck
npm run lint             # ESLint
npm run typecheck        # tsc -b
npm run test             # Run all tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only

# Mock API + database
npm run mock:up          # Start the DB and the mock API
npm run mock:api         # Start the mock API only
npm run mock:seed        # Reseed the mock database
npm run mock:reset       # Start the DB and reseed it
npm run db:up            # Start the Postgres container
npm run db:down          # Stop the Postgres container
npm run db:logs          # Follow the Postgres container logs
```
