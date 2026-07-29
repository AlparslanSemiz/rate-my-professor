# Admin Web

Admin Web is a moderation and administration console for a student community
platform. It gives administrators one place to monitor the system, manage user
accounts, review community reports, process bug reports, and inspect an
immutable history of administrative actions.

The repository contains both the React frontend and a complete local demo
environment. The demo environment consists of a small Node.js mock API,
PostgreSQL, seeded sample data, and a production-style Nginx web container.

## Table of Contents

- [Main Features](#main-features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Quick Start with Docker](#quick-start-with-docker)
- [Development with Hot Reload](#development-with-hot-reload)
- [Demo Walkthrough](#demo-walkthrough)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Authentication and Authorization](#authentication-and-authorization)
- [API Reference](#api-reference)
- [Audit Log Design](#audit-log-design)
- [Lazy Loading and Code Splitting](#lazy-loading-and-code-splitting)
- [Quality Assurance](#quality-assurance)
- [Available Commands](#available-commands)
- [Production Build](#production-build)
- [Troubleshooting](#troubleshooting)

## Main Features

| Module | Purpose |
| --- | --- |
| Authentication | Two-step email and login-code flow with protected admin routes |
| Dashboard | At-a-glance user, activity, administrator, and report statistics |
| Users | Search users, inspect profiles and warning history, warn, block, unblock, or delete accounts |
| Reported Comments | Search and filter community reports, inspect involved users, and update moderation status |
| Bug Reports | Review submitted problems and update their status or severity |
| Audit Logs | Filter and inspect successful administrative actions, including before/after values |
| Activity Log | Filter and inspect what everyone does in the application, including failed and denied attempts |
| System Status | Watch backend health, live record counts, and when each admin action last reached the database |

Additional engineering features include:

- A responsive interface built with Mantine.
- A shared, typed API client with consistent error handling.
- Feature-based source organization with small, focused components and hooks.
- Route-level lazy loading to keep the initial JavaScript download small.
- Unit and integration tests with Vitest and Testing Library.
- A reproducible local stack with Docker Compose and seeded PostgreSQL data.

## Technology Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript, React Router, Mantine, Tabler Icons |
| Build tooling | Vite 8, TypeScript compiler |
| Tests | Vitest, Testing Library, jsdom |
| Code quality | ESLint, TypeScript strict checks |
| Local API | Node.js HTTP server |
| Database | PostgreSQL 16 |
| Containers | Docker Compose, multi-stage Docker build, Nginx |

Node.js 24 is recommended because it matches the version used by the Docker
build.

## System Architecture

```text
┌──────────────────────────────────────────────────────────┐
│ Browser                                                  │
│ React SPA · protected routes · route-level lazy loading  │
└────────────────────────────┬─────────────────────────────┘
                             │ JSON over HTTP
                             │ Authorization: Bearer <token>
                             ▼
┌──────────────────────────────────────────────────────────┐
│ API                                                      │
│ auth · users · comments · reports · logs · system status │
└────────────────────────────┬─────────────────────────────┘
                             │ parameterized SQL
                             │ transactional writes
                             ▼
┌──────────────────────────────────────────────────────────┐
│ PostgreSQL                                               │
│ users · sessions · warnings · reports · audit · activity │
└──────────────────────────────────────────────────────────┘
```

In the Docker setup, Nginx serves the compiled frontend and forwards `/api/*`
requests to the API container. During frontend development, Vite serves the
application directly and calls the API at `http://localhost:8080`.

The local API is intentionally lightweight. It implements the contract needed
by this admin application; it is not intended to replace the production
backend.

## Quick Start with Docker

This is the easiest and most reproducible way to run the complete project.

### Prerequisites

- Docker Desktop or Docker Engine with Docker Compose
- Node.js 24 and npm

### Start the application

From the repository root:

```bash
npm run docker:up
```

The command builds the containers, waits for their health checks, initializes
the database, and starts all three services:

| Service | Address |
| --- | --- |
| Web application | [http://localhost:5173](http://localhost:5173) |
| Mock API | [http://localhost:8080](http://localhost:8080) |
| PostgreSQL | `localhost:5432` |

Use the following demo administrator:

```text
Email: u-kisi4@student.kit.edu
Code:  123456
```

The login-code endpoint does not send a real email in local demo mode. It
returns the configured demo code so the entire workflow can be evaluated
without an email provider.

### Stop the application

```bash
npm run docker:down
```

The PostgreSQL data is stored in the `admin_web_pgdata` Docker volume and
therefore remains available after the containers are stopped.

## Development with Hot Reload

Use this setup when changing frontend code and you want Vite's fast refresh.

Install the dependencies once:

```bash
npm ci
```

Start PostgreSQL and the mock API in the first terminal:

```bash
npm run mock:up
```

Start the frontend in a second terminal:

```bash
npm run dev:local
```

Then open [http://localhost:5173](http://localhost:5173) and sign in with the
demo account shown above.

To restore the seeded demo records:

```bash
npm run mock:reset
```

## Demo Walkthrough

The following short flow demonstrates the important project capabilities:

1. Sign in with the demo administrator and code.
2. Review the system summary and recent registrations on the dashboard.
3. Open **Users**, select a profile, and inspect its moderation history.
4. Open **Reported Comments** and change the status of a report.
5. Open **Bug Reports** and update a report's status or severity.
6. Open **Audit Logs** and locate the actions performed in the previous steps.
7. Inspect an audit event to compare its before and after values.
8. Sign out and verify that protected routes return to the login page.

State-changing operations are recorded in the audit log only when they
succeed. This makes the final two steps useful for demonstrating both the UI
and the data model.

## Configuration

### Frontend API URL

Vite reads `VITE_API_BASE_URL` when the development server starts or the
production bundle is built.

```env
VITE_API_BASE_URL=http://localhost:8080
```

The repository provides these environment files:

| File | Usage |
| --- | --- |
| `.env.example` | Example frontend configuration |
| `.env.demo-local` | Local Vite mode used by `npm run dev:local` |
| `.env.docker` | Ports, database credentials, and demo-only values for Docker Compose |

The Docker web image uses `VITE_API_BASE_URL=/api`. Nginx then proxies the
request to the API container, which keeps the browser on a single origin.

Environment values are read at startup/build time. Restart the Vite server or
rebuild the web image after changing them.

### Local Docker settings

The defaults in `.env.docker` are:

| Variable | Default | Purpose |
| --- | --- | --- |
| `LOCAL_WEB_PORT` | `5173` | Web port exposed on the host |
| `LOCAL_API_PORT` | `8080` | API port exposed on the host |
| `LOCAL_DB_PORT` | `5432` | PostgreSQL port exposed on the host |
| `LOCAL_DB_NAME` | `admin_web` | Local database name |
| `LOCAL_DB_USER` | `admin_web` | Local database user |
| `LOCAL_DB_PASSWORD` | `admin_web` | Local database password |
| `VITE_DEMO_LOGIN_CODE` | `123456` | Local login code |
| `VITE_DEMO_ADMIN_TOKEN` | `dev-admin-token` | Stable local token for the primary demo administrator |

These values are development conveniences, not production secrets. Production
credentials and tokens must be provided through the deployment environment and
must not be committed.

## Project Structure

The frontend is organized by ownership and responsibility:

```text
src/
├── api/          HTTP client and typed backend service contracts
├── components/   Reusable, feature-independent UI components
├── constants/    Routes, colors, layout values, and shared styles
├── context/      Application-wide authentication state
├── domain/       Shared domain types and moderation rules
├── features/     Feature-owned pages, components, hooks, and tests
│   ├── activity-logs/
│   ├── audit-logs/
│   ├── auth/
│   ├── comments/
│   ├── dashboard/
│   ├── feedback/
│   ├── system-status/
│   └── users/
├── hooks/        Reusable hooks without feature ownership
├── layouts/      Authenticated application shell and navigation
├── test/         Shared test setup and HTTP test helpers
└── utils/        Small, reusable utility functions
```

Each feature keeps its page, feature-specific components, hooks, and tests
together. Shared code is moved to a top-level folder only when more than one
feature owns the same responsibility.

The local API follows a similar separation:

```text
scripts/mock-api/
├── routes/            Endpoint-specific request handlers
├── server.mjs         HTTP server entry point
├── router.mjs         Top-level route dispatch and error boundary
├── http.mjs           Request parsing and response helpers
├── auth-session.mjs   Authentication and admin authorization
├── db.mjs             PostgreSQL connection and transactions
├── mappers.mjs        Database-to-API response mapping
├── audit.mjs          Audit event definitions and writes
├── audit-query.mjs    Audit filtering and cursor pagination
├── audit-cursor.mjs   Opaque cursor encoding and validation
├── schema.mjs         Database schema
├── fixtures.mjs       Demo records
├── seed-data.mjs      Fixture persistence
└── seed.mjs           Database initialization and reseeding orchestration
```

## Authentication and Authorization

The local login flow has two steps:

1. `POST /auth/request-login` validates a KIT student email and creates a demo
   login code.
2. `POST /auth/login` exchanges the email and code for an `authToken`.

The frontend stores the authenticated session locally and the shared API client
sends the token on protected requests:

```http
Authorization: Bearer <authToken>
```

The browser route guard prevents anonymous access to admin pages. The API
independently validates the token and requires the associated user to have the
`ADMIN` role. Client-side protection improves the user experience, while the
server-side check is the actual authorization boundary.

The demo login must use one of the seeded administrator accounts. A valid
`@student.kit.edu` address that is not an administrator can authenticate, but
cannot access protected admin endpoints.

## API Reference

Unless stated otherwise, endpoints require an authenticated administrator
token.

### Health

| Method | Path | Description | Authentication |
| --- | --- | --- | --- |
| `GET` | `/health` | API health status | No |

### Authentication

| Method | Path | Description | Authentication |
| --- | --- | --- | --- |
| `POST` | `/auth/request-login` | Request a login code for `{ "email": "..." }` | No |
| `POST` | `/auth/login` | Exchange `{ "email": "...", "loginToken": "..." }` for an `authToken` | No |
| `POST` | `/auth/logout` | Revoke the current token | Admin |
| `GET` | `/auth/me` | Inspect the current session | Optional |

### Users

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/users` | List users and moderation statistics |
| `GET` | `/users/:id` | Get one user profile |
| `DELETE` | `/users/:id` | Delete one user |
| `PATCH` | `/users/:id/block` | Set user status to `BLOCKED` |
| `PATCH` | `/users/:id/unblock` | Set user status to `ACTIVE` |
| `GET` | `/users/:id/warnings` | Get warning history |
| `POST` | `/users/:id/warnings` | Create a warning with `{ "message": "..." }` |

### Reported comments

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/comments/reported` | List reported comments |
| `PATCH` | `/comments/reported/:id` | Update `{ "status": "..." }` |

Supported statuses are `OPEN`, `REVIEWED`, `DISMISSED`, and `ACTION_TAKEN`.

### Bug reports

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/reports` | List bug reports |
| `PATCH` | `/reports/:id` | Update `status`, `severity`, or both |

Supported severities are `LOW`, `MEDIUM`, `HIGH`, and `CRITICAL`. Bug report
statuses use the same values as reported comments.

### Audit logs

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/audit-logs` | Get a filtered, cursor-paginated audit history |
| `GET` | `/audit-logs/meta` | Get available actors, actions, and target types |

`GET /audit-logs` accepts:

| Query parameter | Meaning |
| --- | --- |
| `limit` | Number of records to return; the frontend requests 50 |
| `cursor` | Opaque cursor returned by the previous page |
| `q` | Search actor name/email or target label |
| `actorId` | Filter by administrator |
| `action` | Filter by action type |
| `targetType` | Filter by target type |
| `from` | Inclusive ISO date/time lower bound |
| `to` | Inclusive ISO date/time upper bound |

### Activity log

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/activity-logs` | Get a filtered, cursor-paginated history of what everyone did |
| `GET` | `/activity-logs/meta` | Get available actors, activity types, target types, and outcomes |

`GET /activity-logs` takes the same parameters as the audit history, except
that `action` becomes `type` and an `outcome` filter is added
(`SUCCESS`, `FAILURE`, or `DENIED`). Unlike audit actions, activity types are an
open set: the filter dropdown is built from the metadata endpoint so a new
backend type appears without a frontend release.

### System status

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/system/status` | Get backend health, live record counts, and last write timestamps |

The response reports `status` (`OK`, `DEGRADED`, or `DOWN`), a measured
database round trip, live counters, and the last successful write time per
administrative action. The counters are what confirm an action reached the
database: block a user, refresh, and watch `blockedUsers` increase.

## Audit Log Design

The audit history answers four questions: **who** performed an action, **what**
they did, **which record** they affected, and **what changed**.

```json
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
    "status": {
      "before": "ACTIVE",
      "after": "BLOCKED"
    }
  },
  "metadata": {}
}
```

Supported actions:

- `ADMIN_LOGIN`
- `ADMIN_LOGOUT`
- `USER_WARNING_CREATED`
- `USER_BLOCKED`
- `USER_UNBLOCKED`
- `USER_DELETED`
- `COMMENT_REPORT_STATUS_CHANGED`
- `BUG_REPORT_UPDATED`

Audit entries contain snapshots of their actor and target labels. They
therefore remain understandable even if the original user or report is later
deleted. Every successful state change and its audit event are written in the
same database transaction, preventing one from being saved without the other.

Pagination uses an opaque cursor rather than a page number. This is stable when
new events are inserted while an administrator is browsing older records.

## Lazy Loading and Code Splitting

Lazy loading means downloading code only when it is needed. Without it, the
browser must download the JavaScript for every admin page before showing even
the login screen.

This project uses `React.lazy`, dynamic `import()`, and `Suspense` at route
boundaries:

- The login and authenticated application layout are separate chunks.
- Dashboard, Users, Reported Comments, Bug Reports, Audit Logs, Activity Log,
  and System Status are separate page chunks.
- `PageLoader` provides feedback while a requested chunk is loading.

As a result, the initial production bundle contains only the application shell
and shared dependencies. Visiting a module downloads that module's code and
the browser caches it for later visits. This improves initial loading without
changing routes, APIs, or feature behavior.

This code splitting is about frontend JavaScript. API data is already loaded
independently by the relevant feature hooks.

## Quality Assurance

Run the complete local quality gate before submitting changes:

```bash
npm run check
npm test
npm run build
```

The checks cover:

- ESLint rules and React hook usage.
- TypeScript compilation.
- Unit tests for utilities, domain rules, API services, hooks, authentication,
  and audit queries.
- Integration tests for routing and the main feature pages.
- A production build, including Vite's route chunk generation.

Tests use controlled HTTP responses and do not require the Docker stack unless
the test explicitly exercises the live local API.

## Available Commands

### Application

| Command | Description |
| --- | --- |
| `npm run dev` | Start Vite using the default environment |
| `npm run dev:local` | Start Vite against the local mock API |
| `npm run build` | Type-check and create the production bundle |
| `npm run preview` | Preview the built `dist/` directory |

### Docker stack

| Command | Description |
| --- | --- |
| `npm run docker:up` | Build and start web, API, and PostgreSQL |
| `npm run docker:down` | Stop and remove the stack containers |
| `npm run docker:logs` | Follow logs from every stack service |

### Quality

| Command | Description |
| --- | --- |
| `npm run check` | Run lint and type checking |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run the TypeScript compiler |
| `npm test` | Run all tests once |
| `npm run test:unit` | Run unit tests only |
| `npm run test:integration` | Run integration tests only |

### Mock API and database

| Command | Description |
| --- | --- |
| `npm run mock:up` | Start PostgreSQL, then run the mock API |
| `npm run mock:api` | Run only the mock API |
| `npm run mock:seed` | Initialize or reseed the database |
| `npm run mock:reset` | Start PostgreSQL and reseed the database |
| `npm run db:up` | Start only PostgreSQL |
| `npm run db:down` | Stop only PostgreSQL |
| `npm run db:logs` | Follow PostgreSQL logs |

## Production Build

Create an optimized build:

```bash
npm ci
npm run build
```

The deployable files are written to `dist/`. To inspect them locally:

```bash
npm run preview
```

Two values are embedded into the frontend during the build and cannot be
changed afterwards without rebuilding:

| Variable | Meaning | Default |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Backend the panel calls | `http://localhost:8080` |
| `VITE_BASE_PATH` | URL path the panel is served from | `/admin/` for builds, `/` for the dev server |

The repository's multi-stage `Dockerfile` provides three runtime targets:

- `api` runs the local mock API.
- `web` serves the compiled frontend at the root and proxies `/api/` to the
  mock API. It is part of the local demo stack and expects that service.
- `web-prod` serves the compiled frontend under `VITE_BASE_PATH` with no
  upstream dependency. This is the deployable image.

### Deploying the production image

The panel is served from `/admin/` on the same host as the backend, so browser
requests to the API are same-origin and need no CORS handling.

Deployment is driven by CI/CD (`.gitlab-ci.yml`):

1. `web:image` builds the `web-prod` target with Kaniko and pushes it to this
   project's GitLab Container Registry (`$CI_REGISTRY_IMAGE:latest` and
   `:$CI_COMMIT_SHORT_SHA`) whenever `main` gets a new commit.
2. `web:deploy` is a manual job on `main` that SSHes into the deployment host,
   pulls the image the previous job pushed, and restarts the
   `admin-web-prod` container. Trigger it from the pipeline view in GitLab
   when you want the change live.

If the registry or CI is unreachable, `scripts/deploy-prod.ps1` is a fallback
that builds and runs the image directly on the deployment host's Docker
daemon over SSH — no local Docker daemon or registry needed:

```powershell
pwsh scripts/deploy-prod.ps1
```

The container publishes on the loopback interface only. The host's Nginx
terminates TLS and forwards the public path to it, keeping the `/admin/`
prefix:

```nginx
location /admin/ {
    proxy_pass http://127.0.0.1:8081;   # no trailing slash: keep the prefix
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Hashed assets are served with a one-year immutable cache; `index.html` is sent
with `no-store` so a released build is picked up on the next page load. To
release a new version, push to `main` and trigger the manual `web:deploy`
job; to roll back, run `web:deploy` again against an older commit's pipeline
(or re-run `scripts/deploy-prod.ps1` from that commit).

The production backend is outside this repository and must implement the API
contract documented above.

## Troubleshooting

### A port is already in use

Change `LOCAL_WEB_PORT`, `LOCAL_API_PORT`, or `LOCAL_DB_PORT` in `.env.docker`,
then restart the Docker stack.

### The frontend cannot reach the API

Check the API health endpoint:

```bash
curl http://localhost:8080/health
```

For hot-reload development, use `npm run dev:local`. If
`VITE_API_BASE_URL` was changed while Vite was running, restart the development
server.

### Login succeeds but admin requests return `403`

Only seeded administrator accounts can access protected endpoints. Use the
documented demo account when evaluating the local stack.

### Demo data is missing or was modified

Restore the fixtures:

```bash
npm run mock:reset
```

### A Docker service is unhealthy

Inspect all service logs:

```bash
npm run docker:logs
```

The API waits for PostgreSQL to become healthy, and the web container waits for
the API. The logs therefore usually show which dependency failed first.
