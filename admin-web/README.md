# Admin Web

Admin Web is a moderation and administration console for a student community
platform. It gives administrators one place to monitor the system, manage user
accounts, review community reports, process bug reports, and inspect an
immutable history of administrative actions.

This repository contains the React frontend only. It talks to the backend
service over HTTP and holds no database or API of its own — point
`VITE_API_BASE_URL` at a running backend and everything else follows from
that.

## Table of Contents

- [Main Features](#main-features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Quick Start](#quick-start)
- [Walkthrough](#walkthrough)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Authentication and Authorization](#authentication-and-authorization)
- [API Reference](#api-reference)
- [Known Backend Gaps](#known-backend-gaps)
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
| Users | Search users, inspect profiles and warning history, edit account fields, warn, block, unblock, or delete accounts |
| Comments | Browse every comment, edit or hide its text, delete it, and work the report queue |
| Answers | The same for replies posted under comments, with the parent thread as context |
| Catalogue | Edit and remove lectures and professors, and reassign who teaches what |
| Bug Reports | Review submitted problems, rewrite the title or description, update status or severity, and delete |
| Audit Logs | Filter and inspect administrative actions, including before/after values |
| Activity Log | Filter and inspect what users did in the student app, plus every refused request |
| System Status | Watch backend health, live record counts, and when each admin action last reached the database |

Additional engineering features include:

- A responsive interface built with Mantine.
- A shared, typed API client with consistent error handling.
- Feature-based source organization with small, focused components and hooks.
- Route-level lazy loading to keep the initial JavaScript download small.
- Unit and integration tests with Vitest and Testing Library.

## Technology Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript, React Router, Mantine, Tabler Icons |
| Build tooling | Vite 8, TypeScript compiler |
| Tests | Vitest, Testing Library, jsdom |
| Code quality | ESLint, TypeScript strict checks |
| Containers | Multi-stage Docker build + Nginx (production image, built in CI/CD) |

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
│ Backend (separate repository)                            │
│ auth · users · content · catalogue · logs · system status │
└──────────────────────────────────────────────────────────┘
```

In development, Vite serves the frontend and proxies `/api` to the backend, so
the browser only ever talks to `localhost:5173`. In production, Nginx serves the
static build under `VITE_BASE_PATH` with no API proxy — the browser calls the
backend directly (same-origin; see "Deploying the production image").

Both arrangements are same-origin from the browser's point of view, which is
deliberate: development exercises the same request topology as production
instead of a second one that only exists on developer machines.

## Quick Start

### Prerequisites

- Node.js 24 and npm
- A reachable backend (see the backend repository for how to run one)

### Start the application

Install the dependencies once:

```bash
npm ci
```

Point the dev proxy at your backend in `.env`. The panel calls `/api`, and the
dev server forwards that to `VITE_API_TARGET`:

```env
VITE_API_BASE_URL=/api
VITE_API_TARGET=https://your-backend.example.org
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and sign in with one of the
admin addresses (see "Authentication and Authorization"). The backend emails a
six-character login code, which expires after five minutes.

Because the dev server proxies the API, the browser makes same-origin requests
and CORS never enters into it. If you would rather point `VITE_API_BASE_URL`
straight at an absolute backend URL, add the panel's origin
(`http://localhost:5173`) to the backend's `ADMIN_FRONTEND_ORIGINS` first —
without it the backend answers `403 Invalid CORS request` to the preflight and
no request reaches a controller.

## Walkthrough

The following short flow demonstrates the important project capabilities:

1. Sign in with an admin address and the emailed code.
2. Review the system summary and recent registrations on the dashboard.
3. Open **Users**, select a profile, edit a field, and inspect its moderation
   history.
4. Open **Comments**, hide a comment from the content tab, then work its report
   from the reports tab.
5. Open **Bug Reports** and update a report's status or severity.
6. Open **Audit Logs** and locate the actions performed in the previous steps.
7. Inspect an audit event to compare its before and after values.
8. Open **Activity Log** to see what students did and what the backend refused.
9. Sign out and verify that protected routes return to the login page.

State-changing operations are recorded in the audit log only when they
succeed. This makes the final steps useful for demonstrating both the UI and
the data model.

## Configuration

### Frontend API URL

Vite reads `VITE_API_BASE_URL` when the development server starts or the
production bundle is built. It is the path or URL the panel calls; `/api` means
"whatever is serving this page", which is what keeps requests same-origin.

```env
VITE_API_BASE_URL=/api
VITE_API_TARGET=https://your-backend.example.org
```

| Variable | Read by | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | The bundle | Path or URL every request is prefixed with |
| `VITE_API_TARGET` | The dev server only | Backend the `/api` proxy forwards to |

`VITE_API_TARGET` never reaches the browser — it configures the proxy in
`vite.config.ts` and has no effect on a production build. Point it at a locally
running backend when you have one.

`.env` is the only environment file: it is what `npm run dev` reads. A real
environment variable takes precedence over it, which is how the Docker build
and the CI pipeline bake an absolute `VITE_API_BASE_URL` into the production
bundle without editing `.env`.

Environment values are read at startup/build time. Restart the Vite server
after changing them.

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
│   ├── answers/
│   ├── audit-logs/
│   ├── auth/
│   ├── catalog/
│   ├── comments/
│   ├── dashboard/
│   ├── feedback/
│   ├── moderation/   Content and report screens shared by comments and answers
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

## Authentication and Authorization

Signing in has two steps:

1. `POST /auth/request-login` validates a KIT student email and emails a
   six-character login code.
2. `POST /auth/login` exchanges the email and code for an `authToken`.

The frontend stores the authenticated session locally and the shared API client
sends the token on protected requests:

```http
Authorization: Bearer <authToken>
```

A stored token is a claim, not proof — it can be revoked while the tab is
closed — so on load the panel confirms it with `GET /auth/me` before treating
the session as valid, and holds protected routes on a loading state until it
answers. A `401` from any request ends the session and returns to the login
screen, which says the session expired rather than presenting a bare form. The
path that was being visited travels with the redirect, so signing in again
returns there instead of the dashboard.

A backend that is merely unreachable does **not** end the session: being unable
to confirm a token says nothing about whether it is still good, and signing an
admin out over a dropped connection would lose their place for no reason.

### Who may sign in

The panel is limited to the admin team. `src/utils/adminAccess.ts` holds those
addresses, and the login form checks the address **before** requesting a code:
an address outside the list is answered with "You do not have access to this
panel" and no code is ever sent. The check runs again before the code is
exchanged, because the address can be edited between the two steps.

To add or remove an administrator, edit that list and the backend's
`ADMIN_BOOTSTRAP_EMAILS` together — the frontend decides who is offered a code,
the backend decides who is actually authorized.

This client-side gate is a usability boundary, not a security one. The backend
independently validates the token and requires an `admins` row for every
protected endpoint; a valid non-admin token is answered with `403` regardless
of what the frontend does.

## API Reference

Unless stated otherwise, endpoints require an authenticated administrator
token. The backend repository's `docs/admin-api.md` is the authoritative
contract; this table is the subset the panel calls.

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
| `GET` | `/auth/me` | Inspect the current session | Any |

### Users

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/users` | List users and moderation statistics |
| `GET` | `/users/:id` | Get one user profile |
| `PATCH` | `/users/:id` | Edit any subset of `username`, `kitEmail`, `biography`, `status`, `role`, `credibilityScore` |
| `DELETE` | `/users/:id` | Soft-delete and anonymize one user |
| `PATCH` | `/users/:id/block` | Set user status to `BLOCKED` |
| `PATCH` | `/users/:id/unblock` | Set user status to `ACTIVE` |
| `GET` | `/users/:id/warnings` | Get warning history |
| `POST` | `/users/:id/warnings` | Create a warning with `{ "message": "..." }` |
| `PATCH` | `/users/:id/warnings/:warningId` | Correct a warning's text |
| `DELETE` | `/users/:id/warnings/:warningId` | Withdraw a warning |

Changing `kitEmail` revokes the account's sessions, and demoting an admin
revokes them too. Self and other admin accounts cannot be blocked, unblocked,
warned or deleted, so the panel does not offer those buttons for them.

> The warning history does not yet return each warning's `id`. Until it does,
> the panel hides the correct/withdraw controls rather than offering an action
> it cannot address — the calls are implemented and light up as soon as the
> field appears.

### Comments and answers

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/comments` | List every comment with author, answer and report counts |
| `PATCH` | `/comments/:id` | Edit `content`, `status` (`VISIBLE`/`HIDDEN`), or both |
| `DELETE` | `/comments/:id` | Delete the comment and the thread under it |
| `GET` | `/comments/reported` | List reported comments |
| `PATCH` | `/comments/reported/:id` | Update `{ "status": "..." }` |
| `DELETE` | `/comments/reported/:id` | Withdraw the report, leaving the comment alone |
| `GET` | `/answers` | List every answer with its parent thread |
| `PATCH` | `/answers/:id` | Edit `content`, `status`, or both |
| `DELETE` | `/answers/:id` | Delete the answer |
| `GET` | `/answers/reported` | List reported answers |
| `PATCH` | `/answers/reported/:id` | Update `{ "status": "..." }` |
| `DELETE` | `/answers/reported/:id` | Withdraw the report |

Report statuses are `OPEN`, `REVIEWED`, `DISMISSED`, and `ACTION_TAKEN`.
`ACTION_TAKEN` is the only status that means the content was moderated, so it
is the only one that hides it; any other status puts it back. Hiding keeps the
content in the database — deleting does not.

### Catalogue

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/data/lectures` | List lectures with their professors and counts |
| `PATCH` | `/data/lectures/:id` | Edit `name`, `code`, `semesterYear`, `semesterSeason`, `active`, `lectureType`, `professorIds` |
| `DELETE` | `/data/lectures/:id` | Delete the lecture with its comments, answers and ratings |
| `GET` | `/data/professor` | List professors with their average rating |
| `PATCH` | `/data/professor/:id` | Edit `firstName`, `lastName`, `active`, `lectureIds` |
| `DELETE` | `/data/professor/:id` | Delete the professor; the lectures stay |

`professorIds` and `lectureIds` replace an assignment wholesale — send `[]` to
clear it. The catalogue reads report a lecture's `lectureType` and a
professor's `active` flag, so both are shown with their current value and sent
only when actually changed.

`averageRating` comes back as `0` rather than `null` for a professor nobody has
rated, so `ratingCount` is what separates "rated badly" from "not rated"; the
panel shows a dash for the latter.

`GET /data/professor` does not report which lectures a professor teaches, so the
panel builds that index from the lecture list it already loaded.

### Ratings

| Method | Path | Description |
| --- | --- | --- |
| `DELETE` | `/ratings/:id` | Delete one rating |

A rating is someone's actual opinion, so it can be removed but not edited.
There is no panel screen for this yet: the backend has no admin listing of
individual ratings, so there is nothing to take an id from. `RatingsService`
implements the call for when one exists.

### Bug reports

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/reports` | List bug reports |
| `PATCH` | `/reports/:id` | Update any of `status`, `severity`, `title`, `description` |
| `DELETE` | `/reports/:id` | Delete a bug report |

Supported severities are `LOW`, `MEDIUM`, `HIGH`, and `CRITICAL`. Bug report
statuses use the same values as content reports.

### Audit logs and activity log

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/audit-logs` | Filtered, cursor-paginated administrative history |
| `GET` | `/audit-logs/meta` | Actors, actions, target types and actor types for that log |
| `GET` | `/activity-logs` | The same for student activity and refused requests |
| `GET` | `/activity-logs/meta` | Filter vocabulary for that log |

Both endpoints read the same table and take the same parameters, differing only
in which actions they serve and whether the array is called `auditLogs` or
`activityLogs`:

| Query parameter | Meaning |
| --- | --- |
| `limit` | Number of records to return (1–100); the frontend requests 50 |
| `cursor` | Opaque cursor returned by the previous page |
| `q` | Search actor name/email or target label |
| `actorId` | Filter by actor |
| `actorType` | `ADMIN` or `USER` |
| `action` | Filter by action |
| `targetType` | Filter by target type |
| `from` | Inclusive ISO date/time lower bound |
| `to` | Inclusive ISO date/time upper bound |

The filter dropdowns are built from the metadata endpoints, so an action added
by the backend appears without a frontend release. `actors` is capped rather
than exhaustive — every account that ever signed in is an actor in the activity
log — so `q` is what finds someone beyond the cap.

### System status

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/system/status` | Backend health, live record counts, and the newest audit event |

The endpoint answers `200` whenever the API is serving and reports a failing
database in `status` (`OK`, `DEGRADED`, or `DOWN`) instead — a page that has to
show "the API is up but the database is not" cannot do that if the request
itself fails. `counts` and `lastWrite` are `null` unless the database answered.
The counters are what confirm an action reached the database: block a user,
refresh, and watch the count move.

## Known Backend Gaps

Nearly all of what this section used to list was **closed by the backend change of
2026-08-20**. That change is not deployed yet, so the panel still runs against the old
contract until it lands; the table below is what remains after it does.

Resolved by that change: each warning now carries its own `id` and its issuer's `name`; the
issuer is derived from the auth token, so the panel stops sending it; `/comments/reported` and
`/answers/reported` carry `commentId` / `answerId`; `GET /data/professor` carries `lectureIds`;
`GET /users` takes `limit`, `cursor`, `q`, `status`, `role` and `sort` and returns
`nextCursor`; `GET /ratings` lists individual ratings with ids; `/auth/me` returns the admin's
real id; `GET /users/{id}` is flat, as the panel assumed; soft-deleted accounts are excluded
from both user reads; `credibilityScore` is returned by both; and `/system/status` carries
`counts.activeUsers` alongside `counts.users`.

Two contract details worth knowing rather than rediscovering: `counts.admins` counts accounts
holding the role, not the allowlist — an address in the backend's bootstrap list is re-promoted
on the next restart or sign-in, so demoting it in the panel does not stick until the address
leaves that configuration. And `POST /users/{id}/warnings` accepts the old `userID` +
`createdFrom` body permanently, not as a temporary shim, so the two repos deploy in any order.

| Gap | Effect on the panel |
| --- | --- |
| A session that ends on **TTL expiry** writes no `ADMIN_LOGOUT` | The pair closes on an explicit sign-out — the panel calls `POST /auth/logout` — and a session the backend revokes itself is recorded on the action that caused it (`USER_UPDATED` with `metadata.sessionsRevoked`). Pure TTL expiry has no actor and no request, so nothing is written. A missing `ADMIN_LOGOUT` is normal and does **not** mean the session is still live. |
| `GET /users` orders differently with and without parameters | Unparameterised it is admins first, then newest. Any paginated call is strictly newest-first, because role is not a column it can sort on. The Users page changes order the moment it paginates. |
| GitLab issue creation is inert until it is configured | Without `GITLAB_BASE_URL`, `GITLAB_PROJECT_ID` and `GITLAB_TOKEN` the backend reports `gitlabEnabled: false` and the endpoint answers `503`. The panel hides the control rather than offering one that cannot work. |

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

One table holds both logs, split by the scope an action belongs to.
`/audit-logs` serves what admins did through the panel — sign-in and sign-out,
user edits, warnings, blocks and deletions, content and report moderation,
bug report changes, and catalogue edits. `/activity-logs` serves what students
did in the app (`USER_LOGIN`, `COMMENT_CREATED`, `RATING_SUBMITTED`, …) plus
the two refusals, `LOGIN_REFUSED` and `ACCESS_REFUSED`. The split is by action
rather than by actor, so a refused admin login sits next to every other
refusal. `src/domain/auditLog.ts` holds both vocabularies.

For student activity, `changes` is empty — nothing existing was modified — and
`metadata` carries the detail, such as the first 120 characters of the
submitted text.

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
- Dashboard, Users, Comments, Answers, Catalogue, Bug Reports, Audit Logs,
  Activity Log, and System Status are separate page chunks.
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
- Unit tests for utilities, domain rules, API services, hooks, and
  authentication.
- Integration tests for routing and the main feature pages.
- A production build, including Vite's route chunk generation.

Tests stub `fetch` with controlled HTTP responses, so the suite runs without a
backend.

## Available Commands

### Application

| Command | Description |
| --- | --- |
| `npm run dev` | Start Vite using `.env` |
| `npm run build` | Type-check and create the production bundle |
| `npm run preview` | Preview the built `dist/` directory |

### Quality

| Command | Description |
| --- | --- |
| `npm run check` | Run lint and type checking |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run the TypeScript compiler |
| `npm test` | Run all tests once |
| `npm run test:unit` | Run unit tests only |
| `npm run test:integration` | Run integration tests only |

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
| `VITE_API_BASE_URL` | Backend the panel calls | `/api` |
| `VITE_BASE_PATH` | URL path the panel is served from | `/admin/` for builds, `/` for the dev server |

`VITE_API_TARGET` is not in this table because it is not embedded in anything:
it only configures the development proxy.

The repository's multi-stage `Dockerfile` builds one runtime target,
`web-prod`: the compiled frontend served under `VITE_BASE_PATH` with no
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

### The frontend cannot reach the API

Check the backend's health endpoint:

```bash
curl <api base>/health
```

If `VITE_API_BASE_URL` was changed while Vite was running, restart the
development server — the value is read at startup.

### `403 Invalid CORS request` when requesting a login code

This should not happen through the dev proxy, which makes requests same-origin.
It appears when `VITE_API_BASE_URL` points straight at an absolute backend URL
and the panel's origin is not in the backend's `ADMIN_FRONTEND_ORIGINS`. The
backend answers before the request reaches a controller. The origin has to be
listed even when the panel and the API share a host, because the browser sends
`Origin` on every non-`GET` request. Confirm with:

```bash
curl -i -X POST -H "Origin: <panel origin>" -H "Content-Type: application/json"   -d '{"email":"nobody@example.invalid"}' <api base>/auth/request-login
```

`400 Invalid KIT email` means the origin is accepted. `403 Invalid CORS
request` means it is not.

### "You do not have access to this panel"

The address is not in the admin list in `src/utils/adminAccess.ts`, so no code
was requested. Add it there and to the backend's `ADMIN_BOOTSTRAP_EMAILS`.

### Login succeeds but admin requests return `403`

The account authenticated but has no `admins` row on the backend. Admin
membership comes from that table, not from the frontend — check
`ADMIN_BOOTSTRAP_EMAILS` and sign in again so the account is provisioned.

### The login code never arrives

Codes are delivered over SMTP by the backend and are never returned in a
response or written to a log. Check the backend's SMTP configuration and its
rate limits: requests default to 3 per email and 20 per source IP per 15
minutes, after which the endpoint answers `429` with `Retry-After`.
