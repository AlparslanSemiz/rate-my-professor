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

Start the local mock API and DB:

```bash
npm run mock:up
```

In a second terminal, start the admin web against the mock API:

```bash
npm run dev:local
```

Demo login:

```text
email: u-kisi4@student.kit.edu
code: 123456
```

Useful DB commands:

```bash
npm run mock:reset
npm run db:logs
npm run db:down
```

Production deploy build:

```env
VITE_API_BASE_URL=https://server.example.org
```

The login flow stores `/auth/login` response field `authToken` and sends it on authenticated admin requests:

```http
Authorization: Bearer <authToken>
```

All endpoints except `GET /health` and the two `/auth` POST routes require an `Authorization: Bearer <authToken>` header for an admin user.

Auth:

- `POST /auth/request-login` with `{ "email": "user@student.kit.edu" }`
- `POST /auth/login` with `{ "email": "user@student.kit.edu", "loginToken": "123456" }`
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

Health:

- `GET /health`

## Scripts

```bash
# App
npm run dev              # Vite dev server
npm run dev:local        # Vite against the local mock API (demo-local mode)
npm run build            # Type-check and build for production
npm run preview          # Preview the production build

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
npm run db:down          # Stop and remove the Postgres container
npm run db:logs          # Follow the Postgres container logs
```
