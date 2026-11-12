# Admin Web

Admin Web is a moderation and administration console for a student community
platform. It gives administrators one place to monitor the system, manage user
accounts, review community reports, process bug reports, and inspect an
immutable history of administrative actions.

This repository contains the React frontend only. It talks to the backend
service over HTTP and holds no database or API of its own: point
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
| Dashboard | At-a-glance user, administrator and report counters, read from `/system/status` |
| Users | Search, filter and page through accounts on the server; inspect profiles and warning history, edit account fields, warn, block, unblock, or delete |
| Comments | Browse every comment, edit or hide its text, delete it, and work the report queue: acting on the reported content from the queue itself |
| Answers | Replies posted under comments: worked from the Comments screen rather than one of their own, with the parent thread as context |
| Lectures & Professors | Edit and remove lectures and professors, reassign who teaches what, and remove individual ratings |
| Bug Reports | Review submitted problems, rewrite the title or description, update status or severity, delete, and open a GitLab issue |
| Audit Logs | Filter and inspect administrative actions, including before/after values, and undo a field edit |
| Activity Logs | The other half of the same table: what students did in the app, and the two kinds of refusal. Nothing here can be undone, and no undo control is drawn |

Additional engineering features include:

- A responsive interface built with Mantine.
- A shared, typed API client with consistent error handling.
- Feature-based source organization with small, focused components and hooks.
- Route-level lazy loading to keep the initial JavaScript download small.
- Unit and integration tests with Vitest and Testing Library, in six layers.
- Accessibility checks with `axe-core` in jsdom, and with `@axe-core/playwright` in Chromium
  for the two rules jsdom cannot answer.

## Technology Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript, React Router, Mantine, Tabler Icons |
| Data loading | TanStack Query: caching, cursor paging, refetch after a write |
| Forms and state | Mantine Form, Mantine Hooks |
| Validation | Zod, for the stored session |
| Errors | react-error-boundary |
| Build tooling | Vite 8, TypeScript compiler |
| Tests | Vitest, Testing Library, jsdom, V8 coverage, `axe-core` |
| Code quality | ESLint, TypeScript under `strict` |
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
static build under `VITE_BASE_PATH` with no API proxy: the browser calls the
backend directly (same-origin; see "Deploying the production image").

Both arrangements are same-origin from the browser's point of view, which is
deliberate: development exercises the same request topology as production
instead of a second one that only exists on developer machines.

## Quick Start

### Prerequisites

- Node.js 24 and npm
- A reachable backend (see the backend repository for how to run one): **except** for
  the test suites, which need none: both the Vitest integration tests and the
  Playwright specs run against an in-process mock of the API.
- For `npm run test:e2e` only: a Chromium that Playwright can find. `npx playwright
  install chromium` fetches it. **The cache location is platform-dependent and the
  revision is pinned to the Playwright version**, which is the detail that costs an
  afternoon:

  | Platform | Cache directory |
  | --- | --- |
  | Linux | `~/.cache/ms-playwright` |
  | macOS | `~/Library/Caches/ms-playwright` |
  | Windows | `%USERPROFILE%\AppData\Local\ms-playwright` |

  Playwright **1.63** wants `chromium-1243`. A directory from an earlier Playwright (  `chromium-1234`, say) sitting beside it is not a substitute and is not used; if
  both are present the suite still fails until 1243 is there. `PLAYWRIGHT_BROWSERS_PATH`
  overrides the location. CI does not install anything: the `web:e2e` job runs on the
  `mcr.microsoft.com/playwright:v1.63.0-noble` image, which ships the matching browser:
  and that job is **manual**, so it runs only when somebody starts it. Pulling a browser
  image and running a second `npm ci` on every push cost more than the suite was worth
  there. Run it locally instead; it needs no backend.

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
(`http://localhost:5173`) to the backend's `ADMIN_FRONTEND_ORIGINS` first:
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
7. Open **Activity Logs** and filter by `Who = User` to see the student side of
   the same table, including any refused sign-in.
7. Inspect an audit event to compare its before and after values.
8. Sign out and verify that protected routes return to the login page.

State-changing operations are recorded in the audit log only when they
succeed. This makes the final steps useful for demonstrating both the UI and
the data model.

## Configuration

### Frontend API URL

Vite reads `VITE_API_BASE_URL` when the development server starts or the
production bundle is built. It is the path or URL every request is prefixed
with.

**The deployed panel builds with an empty value.** It is served from
`https://ratemyprofessor.dev/admin/` and the backend answers on that same host,
so an empty base sends every call to the panel's own origin, same-origin, and
CORS never runs. Development gets the same shape a different way: `/api` plus
the dev server's proxy, which strips the prefix before forwarding.

```env
VITE_API_BASE_URL=/api
VITE_API_TARGET=https://your-backend.example.org
```

| Variable | Read by | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | The bundle | Path or URL every request is prefixed with. Empty in production, `/api` in development |
| `VITE_API_TARGET` | The dev server only | Backend the `/api` proxy forwards to |

`VITE_API_TARGET` never reaches the browser: it configures the proxy in
`vite.config.ts` and has no effect on a production build. Point it at a locally
running backend when you have one.

`.env` is the only environment file: it is what `npm run dev` reads. A real
environment variable takes precedence over it, which is how the Docker build
and the CI pipeline set `VITE_API_BASE_URL` for the production bundle without
editing `.env`.

Do not put an absolute backend URL back in the production build. That is what
was there before, and it is what made the panel unusable: the browser saw a
different origin, preflighted, and the backend answered `403` because the
panel's origin was not in its allowlist. `/api` is not a substitute either:
the deployment host proxies everything below `/admin/` to the backend unchanged,
so a `/api` prefix would reach the backend intact and `404`.

Environment values are read at startup/build time. Restart the Vite server
after changing them.

## Project Structure

The frontend is organized by ownership and responsibility:

```text
src/
├── api/          One package per backend domain, each behind a barrel
│   ├── client/       ApiClient, request building, response parsing, HttpService
│   ├── auth/
│   ├── users/
│   ├── moderation/   Comments and answers: one generic service, two nouns
│   ├── catalog/      Lectures, professors and ratings
│   ├── logs/         Audit log
│   ├── feedback/     Bug reports and the GitLab issue control
│   └── system/
├── components/   Reusable, feature-independent UI components
├── constants/    Routes, KIT accent colours, layout values
├── context/      Application-wide authentication state
├── domain/       Shared domain types, enums and their guards
├── features/     Feature-owned pages, components, hooks, model and tests
│   ├── logs/            # both log screens, over one reader and one table
│   ├── auth/
│   ├── catalog/      model/: display, edit and deletion rules
│   ├── comments/
│   ├── dashboard/
│   ├── feedback/     model/ (the queue split and the edit rules
│   ├── help/         content/) one file per documented screen
│   ├── moderation/   Content and report screens shared by comments and answers;
│   │                 model/ (the content rules and the report mapping
│   └── users/        model/) filters, counts, access, confirmation and edit rules
├── hooks/        useSearch and useSelectedId: the two without feature ownership
├── layouts/      Authenticated application shell and navigation
├── test/         Test setup, the JSON response helper and the query-client wrapper
├── theme/        Mantine theme: KIT palette, neutral chrome, component defaults
├── query.ts      The panel's fetching policy: staleness, retries, mutation rules
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

A stored token is a claim, not proof (it can be revoked while the tab is
closed), so on load the panel confirms it with `GET /auth/me` before treating
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
`ADMIN_BOOTSTRAP_EMAILS` together: the frontend decides who is offered a code,
the backend decides who is actually authorized.

One address is additionally allowed to **moderate other admin accounts**:
warn, block, unblock, delete, and change an admin's status. The panel does not
decide this and keeps no list of its own: the backend resolves it from
`ADMIN_SUPERUSER_EMAILS` and reports it as `isSuperAdmin` on `/auth/me`, which
is the only thing the panel reads. It stays a behavioural permission, not a
role: the account is reported and rendered as `ADMIN` everywhere, `UserRole`
remains `'STUDENT' | 'ADMIN'`, and there is no badge or label for it. Everything
else (a username, biography, credibility score or a demotion to `STUDENT`) is
accepted from any admin, and nobody moderates their own account.

This client-side gate is a usability boundary, not a security one. The backend
independently validates the token and requires an `admins` row for every
protected endpoint; a valid non-admin token is answered with `403` regardless
of what the frontend does.

The reasoning behind both decisions (the address list living in the bundle, and
the elevated operator staying a behaviour rather than a role) is in
[ADR 0010](docs/adr/0010-admin-email-list-in-the-bundle.md) and
[ADR 0004](docs/adr/0004-elevated-operator-is-behaviour-not-a-role.md). The rule
itself is stated once, as the backend contract, in
[docs/backend-tasks.md](docs/backend-tasks.md#a-elevated-operator-for-the-admin-panel).

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
| `GET` | `/auth/me` | Inspect the current session; reports `user` as `{ id, username, kitEmail, role, status, isSuperAdmin }` | Any |

### Users

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/users` | List users and moderation statistics; takes `limit`, `cursor`, `q`, `status`, `role`, `sort` and returns `nextCursor` |
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

The listing parameters mirror the log endpoints: `limit` is 1–100 (the panel
asks for 50), `cursor` continues the previous page, `q` searches name and
email, `status` is `ACTIVE`/`INACTIVE`/`BLOCKED`, `role` is `ADMIN`/`STUDENT`
and `sort` is `newest`/`oldest`. **Passing any of them changes the ordering**:
the listing is administrators-first only on an unparameterised call, and
strictly newest-first otherwise, because role is not a column to sort on. A bad
parameter is a `400` with a usable message (`A cursor requires a limit`,
`Invalid user status`), which the panel shows verbatim.

A warning carries its own `id`, and `createdFrom` is `{ id, name, createdAt }`
where `id` is the issuing admin's **student** id: the same value `/auth/me`
reports, so "did I issue this?" needs no second lookup. The issuer is taken from
the auth token, so `POST /users/:id/warnings` sends `{ message }` and nothing
else; the older body is still accepted.

### Comments and answers

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/comments` | List every comment with author, answer and report counts |
| `PATCH` | `/comments/:id` | Edit `content`, `status` (`VISIBLE`/`HIDDEN`), or both |
| `DELETE` | `/comments/:id` | Delete the comment and the thread under it |
| `GET` | `/comments/reported` | List reported comments, each carrying its `commentId` |
| `PATCH` | `/comments/reported/:id` | Update `{ "status": "..." }` |
| `DELETE` | `/comments/reported/:id` | Withdraw the report, leaving the comment alone |
| `GET` | `/answers` | List every answer with its parent thread |
| `PATCH` | `/answers/:id` | Edit `content`, `status`, or both |
| `DELETE` | `/answers/:id` | Delete the answer |
| `GET` | `/answers/reported` | List reported answers, each carrying `answerId` and `commentId` |
| `PATCH` | `/answers/reported/:id` | Update `{ "status": "..." }` |
| `DELETE` | `/answers/reported/:id` | Withdraw the report |

A report's own `id` addresses the report: its status and its withdrawal. The
`commentId` / `answerId` beside it addresses the content the report is about,
which is what the reports tab edits, hides or deletes.

Report statuses are `OPEN`, `REVIEWED`, `DISMISSED`, and `ACTION_TAKEN`.
`ACTION_TAKEN` is the only status that means the content was moderated, so it
is the only one that hides it; any other status puts it back. Hiding keeps the
content in the database: deleting does not.

### Lectures & Professors

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/data/lectures` | List lectures with their professors and counts |
| `PATCH` | `/data/lectures/:id` | Edit `name`, `code`, `semesterYear`, `semesterSeason`, `active`, `lectureType`, `professorIds` |
| `DELETE` | `/data/lectures/:id` | Delete the lecture with its comments, answers and ratings |
| `GET` | `/data/professor` | List professors with their average rating and `lectureIds` |
| `PATCH` | `/data/professor/:id` | Edit `firstName`, `lastName`, `active`, `lectureIds` |
| `DELETE` | `/data/professor/:id` | Delete the professor; the lectures stay |

`professorIds` and `lectureIds` replace an assignment wholesale: send `[]` to
clear it. The catalogue reads report a lecture's `lectureType` and a
professor's `active` flag, so both are shown with their current value and sent
only when actually changed.

`averageRating` comes back as `0` rather than `null` for a professor nobody has
rated, so `ratingCount` is what separates "rated badly" from "not rated"; the
panel shows a dash for the latter.

### Ratings

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/ratings` | List individual ratings; takes `limit`, `cursor` and `lectureId` |
| `DELETE` | `/ratings/:id` | Delete one rating |

A rating is someone's actual opinion, so the Ratings tab is
read-and-delete: there is no edit call, by design. `scores` is read as an open
map, because which categories a rating carries depends on the lecture's type.

### Bug reports

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/reports` | List bug reports, each with `issueUrl` and `issueState` |
| `PATCH` | `/reports/:id` | Update any of `status`, `severity`, `title`, `description` |
| `DELETE` | `/reports/:id` | Delete a bug report |
| `POST` | `/reports/:id/gitlab-issue` | Open a GitLab issue for the report; idempotent |

Supported severities are `LOW`, `MEDIUM`, `HIGH`, and `CRITICAL`. Bug report
statuses use the same values as content reports.

`issueState` is `NONE`, `CREATED` or `FAILED`, and `issueUrl` is set once an
issue exists. Creating one is idempotent: a double press, two admins on the
same queue, or a retry after a timeout all get the existing issue back. The
endpoint answers `503` until the backend is given `GITLAB_BASE_URL`,
`GITLAB_PROJECT_ID` and `GITLAB_TOKEN`, so the panel hides the control while
`/system/status` reports `gitlabEnabled: false`.

### Audit log

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/audit-logs` | Filtered, cursor-paginated administrative history |
| `GET` | `/audit-logs/meta` | Actors, actions, target types and actor types for that log |
| `POST` | `/audit-logs/:id/revert` | Undo the field edit an entry recorded |
| `GET` | `/activity-logs` | The same, for what students did in the app and what was refused |
| `GET` | `/activity-logs/meta` | The vocabulary that log's filters offer |

Both paths are one table split by `actor.type`, and they take the same
parameters, page on the same cursor and return the same entry shape. Only
`/audit-logs` offers a revert. Each returns its array under its own noun (`/audit-logs` under `auditLogs`, `/activity-logs` under `activityLogs`) which
is the one thing a single reader has to be told, and is why
`src/api/logs/logResource.ts` writes both down:

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

Every audit entry also reports whether it can be undone: `revertible`,
`revertBlockedReason` and `revertedByAuditId`. Only field edits are revertible:
a creation, a deletion or a sign-in records that something happened, not what it
contained. A refused revert is a `409` whose `reason` is one of
`ACTION_NOT_REVERTIBLE`, `WINDOW_EXPIRED`, `VALUE_CHANGED`, `ALREADY_REVERTED`
or `TARGET_MISSING`: the same vocabulary `revertBlockedReason` uses, so the
hidden button and the refused one are explained the same way. The success body
is `{ message, success }` and nothing else, so the panel **re-reads** the log
afterwards: that is where the reversal's own entry appears. The grace period is
a backend setting and is deliberately not recomputed here.

The filter dropdowns are built from `/audit-logs/meta`, so an action added
by the backend appears without a frontend release. `actors` is capped rather
than exhaustive (every account that ever signed in is an actor in the shared
log table), so `q` is what finds someone beyond the cap.

### System status

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/system/status` | Backend health, live record counts, and the newest audit event |

**There is no System Status screen.** It was removed on 2026-08-21: if the
backend is down the panel cannot be reached either, so a page devoted to saying
so answers a question nobody can ask. The endpoint itself stayed, because three
screens depend on it.

The endpoint answers `200` whenever the API is serving and reports a failing
database in `status` (`OK`, `DEGRADED`, or `DOWN`) instead. `counts` and
`lastWrite` are `null` unless the database answered; the dashboard treats that
as a reading it does not have rather than as a reading of zero.

`counts` is read as an open map, so a counter the backend adds renders without a
frontend release. The panel reads `users`, `activeUsers`, `admins`,
`openBugReports`, `openCommentReports` and `comments` from it: the dashboard and
the Users page take their figures from here rather than counting rows, which is
what removed two full-table reads every fifteen seconds. `gitlabEnabled` on the
same response is what decides whether the Bug Reports screen offers to open an
issue.

## Known Backend Gaps

Nearly all of what this section used to list was **closed by the backend change of
2026-08-20**, which is now **deployed**. The table below is what remains.

Resolved by that change: each warning now carries its own `id` and its issuer's `name`; the
issuer is derived from the auth token, so the panel stops sending it; `/comments/reported` and
`/answers/reported` carry `commentId` / `answerId`; `GET /data/professor` carries `lectureIds`;
`GET /users` takes `limit`, `cursor`, `q`, `status`, `role` and `sort` and returns
`nextCursor`; `GET /ratings` lists individual ratings with ids; `/auth/me` returns the admin's
real id; `GET /users/{id}` is flat, as the panel assumed; soft-deleted accounts are excluded
from both user reads; `credibilityScore` is returned by both; and `/system/status` carries
`counts.activeUsers` alongside `counts.users`.

Two contract details worth knowing rather than rediscovering: `counts.admins` counts accounts
holding the role, not the allowlist: an address in the backend's bootstrap list is re-promoted
on the next restart or sign-in, so demoting it in the panel does not stick until the address
leaves that configuration. And `POST /users/{id}/warnings` accepts the old `userID` +
`createdFrom` body permanently, not as a temporary shim, so the two repos deploy in any order.

| Gap | Effect on the panel |
| --- | --- |
| A session that ends on **TTL expiry** writes no `ADMIN_LOGOUT` | The pair closes on an explicit sign-out (the panel calls `POST /auth/logout`) and a session the backend revokes itself is recorded on the action that caused it (`USER_UPDATED` with `metadata.sessionsRevoked`). Pure TTL expiry has no actor and no request, so nothing is written. A missing `ADMIN_LOGOUT` is normal and does **not** mean the session is still live. |
| `GET /users` orders differently with and without parameters | Unparameterised it is admins first, then newest. Any paginated call is strictly newest-first, because role is not a column it can sort on. The Users page changes order the moment it paginates. |
| GitLab issue creation is inert until it is configured | Without `GITLAB_BASE_URL`, `GITLAB_PROJECT_ID` and `GITLAB_TOKEN` the backend reports `gitlabEnabled: false` and the endpoint answers `503`. The panel hides the control rather than offering one that cannot work. |
| `/system/status` has **no total bug report counter** | `counts.openBugReports` is the open ones only. The dashboard's "of N bug reports" sub-line and its "Reports handled" percentage were removed rather than kept by reading the whole `/reports` table on a timer. Requested as F1 in `docs/backend-tasks.md`. |
| `/system/status` has **no blocked account counter** | `counts` carries `users`, `activeUsers` and `admins`; `users - activeUsers` is blocked *plus* inactive, so blocked cannot be derived. With the Users table paginated it cannot be counted on screen either, so that stat card is not shown. Requested as F2 in `docs/backend-tasks.md`. |
| The catalogue reads the panel calls return **active records only** | `GET /data/lectures` and `GET /data/professor` filter on `active = true`, but both `PATCH` routes accept `active`: so switching a lecture or professor off from the panel removes it from the only list the panel currently reads, with no way back from the UI. The edit forms warn before the switch is saved. **This is no longer a backend gap:** `/data/lectures/all` and `/data/professor/all` already return every record, active or not (on the legacy path the panel already uses) and the panel has not moved to them. Tracked as `F-006`, and as `G1` in `docs/backend-tasks.md`. |
| A bug report has **no `statusChangedAt`** | It carries `reportedAt` only, so the Bug Reports History tab can show when a report was *filed* but not when it was closed. The subtitle says so rather than letting a filing date pass as a closing one. Requested as F3 in `docs/backend-tasks.md`. |

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
    "email": "unzhz@student.kit.edu",
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
`/audit-logs` serves what admins did through the panel: sign-in and sign-out,
user edits, warnings, blocks and deletions, content and report moderation,
bug report changes, and catalogue edits. The other half, `/activity-logs`, is
what students did in the app plus the two refusals, `LOGIN_REFUSED` and
`ACCESS_REFUSED`.

The panel reads both. It had no Activity Log screen between 2026-09-09 and
2026-09-10. See [ADR 0016](docs/adr/0016-the-activity-log-screen-returns.md):
and `src/domain/auditLog.ts` models both vocabularies again. Neither list is a
filter: the dropdowns are built from `/…/meta` and the tables render whatever
they are given, so a deployment logging something newer than the bundle shows
the new action rather than failing.

The two screens are one feature, `src/features/logs/`, over one reader, one
filter bar, one table, one row and one details modal. What differs is a value:
`logScreen.ts`: and not a shape. Undoing is the exception and is expressed by
type rather than by a flag: the activity screen is typed on `AuditEntry`, which
carries no `revertible`, so an undo control cannot be drawn on it.

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
- Dashboard, Users, Comments, Lectures & Professors, Bug Reports, Audit Logs,
  Activity Logs and Help are separate page chunks. The two log screens share the
  code in `src/features/logs/`, which the bundler hoists into a chunk of its own.
- `PageLoader` provides feedback while a requested chunk is loading.

As a result, the initial production bundle contains only the application shell
and shared dependencies. Visiting a module downloads that module's code and
the browser caches it for later visits. This improves initial loading without
changing routes, APIs, or feature behavior.

This code splitting is about frontend JavaScript. API data is already loaded
independently by the relevant feature hooks.

### Refreshing the API schema

`docs/api/openapi.json` is the backend's own OpenAPI document and is the authority on
request and response **shape** ([ADR 0008](docs/adr/0008-generated-schema-is-the-contract-authority.md)).
It is pulled by hand rather than by CI, because `/v3/api-docs` sits behind
`hasRole("ADMIN")` and so needs a running backend and an admin token. The procedure is
four `curl` commands in [docs/api/README.md](docs/api/README.md); commit the body
**byte for byte**, since the diff between two pulls is the record of what the backend
changed and reformatting destroys it. `npm run schema:types` then regenerates
`src/types/api.generated.ts`, which is never edited by hand.

## Documentation

This README is the tour. Everything below is a document with one job, and each is
authoritative for that job: where two disagree, the one named here wins on its
own subject.

| File | What is in it |
| --- | --- |
| [CHANGELOG.md](CHANGELOG.md) | What has shipped, and **why**. The reasoning is the point. |
| [docs/adr/](docs/adr/) | Architecture decision records: what was decided, what else was weighed, what it costs. Authoritative on *why the design is like this*. |
| [docs/api/](docs/api/) | The backend's OpenAPI schema, committed unchanged, and how to refresh it. Authoritative on request and response **shape**. |
| [docs/class-diagram.md](docs/class-diagram.md) | Package, class, domain and feature diagrams in UML. |
| [docs/DESIGN.md](docs/DESIGN.md) | How the panel is meant to look, and the method for changing it. |
| [docs/TODO.md](docs/TODO.md) | Open work: what is done, what is handed over, what is deliberately not done. |
| [docs/testplan.md](docs/testplan.md) | What is tested, at which layer, and what must be checked by hand. |
| [docs/testfindings.md](docs/testfindings.md) | Findings, the run log, and coverage. |
| [docs/backend-tasks.md](docs/backend-tasks.md) | The file handed to the backend team: what the panel needs, and what it is only notifying them about. |
| [docs/deployment.md](docs/deployment.md) | Docker, the deployed host, the `/admin/` base path. |
| [docs/coursework/](docs/coursework/) | Course-delivery documents: Kolloquium and demo material. **Not part of the product**, tracked because the delivery has to be complete. |
| [wiki.md](wiki.md) | A self-contained copy for the GitLab wiki. Changed together with this file. |

## Quality Assurance

Run the complete local quality gate before submitting changes:

```bash
npm run check
npm test
npm run test:coverage
npm run build
```

The checks cover:

- ESLint rules and React hook usage.
- **No cyclic imports** anywhere in `src/`, checked over every file rather than
  between packages only (`scripts/check-cycles.mjs`).
- **A doc comment on every public service, hook and domain type**
  (`scripts/check-docs.mjs`). Private members are exempt on purpose.
- TypeScript compilation.
- Unit tests for utilities, domain rules, API services, hooks, and
  authentication.
- Integration tests for routing and the main feature pages.
- A production build, including Vite's route chunk generation.

**47 test files, 1138 tests and 3 skipped, green** as of 2026-09-09, at 92.96%
statements / 86.46% branches / 91.52% functions / 94.61% lines, plus **10 Playwright
specs and 68 tests** in the end-to-end layer. The report in `coverage/` is
the authority on those figures; a number written in a document is a dated
snapshot of it.

The suite is organised into **layers named for the questions this panel has**: call
surface, contract, resilience, accessibility, real browser, end-to-end. They are
deliberately *not* the backend's five;
[ADR 0015](docs/adr/0015-panel-test-layers-answer-the-panels-own-questions.md) says why,
and [docs/testplan.md](docs/testplan.md) §3a gives each layer's question **and what it
does not answer**, which is the column worth reading.

One caveat belongs with those numbers rather than beneath them: the suite has failed
once in ten full runs, in `src/App.integration.test.tsx:109`, and the end-to-end suite
once in four. Both tests are identified; neither cause is. A suite that fails once in ten
is not a green suite: `F-024` and `F-033` in
[docs/testfindings.md](docs/testfindings.md).


### What the suite does and does not establish

The suite runs offline and contacts no backend. *How* it avoids one differs by
layer, and the difference matters enough to state rather than summarise:

| Layer | What is replaced | What that proves |
| --- | --- | --- |
| Eight files | **Nothing.** MSW answers the real request, so the screen, its hooks, its services and `ApiClient` all run | The path, method, query string, JSON body and the `Authorization` and `Content-Type` headers a **screen** produces, and what it renders from the answer |
| Remaining API service tests | `fetch` itself, so `ApiClient` and the service run for real | The request a **service** produces, not that any screen asks for it |
| Three remaining page tests | The whole service module, via `vi.mock`: no request is constructed | What a **screen** renders, and which service method it called |
| Model and utility tests | Nothing to replace | Rules in isolation |
| End-to-end | Nothing: the same MSW handlers, in a real browser | That six flows work start to finish with no backend running, plus what only a real browser can measure: layout at 1024 and 1440, focus traps, touch-target sizes and colour contrast |

**The end-to-end suite really does contact nothing, and that is checked rather than
assumed.** `e2e/mock-backend.spec.ts` reads `Response.fromServiceWorker()` on every
`/api/` response across all eight routes. It was not true before: the mock backend had no
catalogue handlers, so three endpoints fell through to the deployed backend from a suite
whose premise is that it contacts nothing.

**Every Playwright spec runs in Chromium only, and against MSW only.** It has never run
against the real backend, so a passing flow is evidence that the panel agrees with *this
repository's* description of the backend: and where that description is wrong, both are
wrong together.

**Six features touch HTTP now**: comments, routing and the session, sign-in, the
audit log and users. A field the backend renames is the class of defect this
closes; it once passed every test here and still signed the operator out on every
reload (`F-002`). What the suite still cannot establish is that the panel's idea of
the contract matches the backend's, which is `P1` in
[docs/TODO.md](docs/TODO.md). Three page tests keep their service mocks by decision
([ADR 0009](docs/adr/0009-msw-slice-by-slice.md)), and
[docs/testplan.md](docs/testplan.md) §7 lists what still has to be checked by hand.

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
| `npm run check` | Run lint, the no-cycles check, the documentation check and type checking |
| `npm run test:e2e` | Run the Playwright end-to-end suite against the in-browser mock backend |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run the TypeScript compiler |
| `npm test` | Run all tests once |
| `npm run test:unit` | Run unit tests only |
| `npm run test:integration` | Run integration tests only |
| `npm run test:coverage` | Run the suite and write the coverage report to `coverage/` |

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
daemon over SSH: no local Docker daemon or registry needed:

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
with `no-store` so a released build is picked up on the next page load.

The panel asks not to be indexed: `index.html` carries
`<meta name="robots" content="noindex,nofollow">` and `public/robots.txt` disallows
everything. Note that `robots.txt` follows the bundle's base path, so on a
deployment under `/admin/` it is served at `/admin/robots.txt`: where a crawler
does not look. Serving one at the domain root is the host proxy's job (`F-047`).

**Security headers are incomplete, and this is recorded rather than fixed.**
`nosniff`, `X-Frame-Options: DENY` and `Referrer-Policy: same-origin` are set on the
HTML location only; the `assets/` location is a more specific prefix with its own
`add_header`, and nginx does not inherit: so JS, CSS and images are served with none
of the three. There is no `Content-Security-Policy` and no `Strict-Transport-Security`
in this repository, and because TLS terminates on a host-level proxy that is not in
it, whether HTTPS is enforced cannot be verified from here. See `F-052` in
[docs/testfindings.md](docs/testfindings.md).

To release a new version, push to `main` and trigger the manual `web:deploy`
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
development server: the value is read at startup.

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
membership comes from that table, not from the frontend: check
`ADMIN_BOOTSTRAP_EMAILS` and sign in again so the account is provisioned.

### The login code never arrives

Codes are delivered over SMTP by the backend and are never returned in a
response or written to a log. Check the backend's SMTP configuration and its
rate limits: requests default to 3 per email and 20 per source IP per 15
minutes, after which the endpoint answers `429` with `Retry-After`.
