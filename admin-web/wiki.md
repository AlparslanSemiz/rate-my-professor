# Admin Web — Project Wiki

> This page is the wiki copy of the project documentation. It is self-contained
> so it can be pasted into the GitLab wiki as-is. It intentionally mirrors
> `README.md` in the repository; when one changes, the other changes with it.

Admin Web is a moderation and administration console for a student community
platform. It gives administrators one place to monitor the system, manage user
accounts, review community reports, process bug reports, and inspect an
immutable history of administrative actions.

The repository contains the **React frontend only**. It talks to the backend
service over HTTP and holds no database or API of its own — point
`VITE_API_BASE_URL` at a running backend and everything else follows from that.

## Contents

1. Modules
2. Technology stack
3. System architecture
4. Quick start
5. Configuration
6. Project structure
7. Authentication and authorization
8. API reference
9. Known backend gaps
10. Audit log design
11. Lazy loading and code splitting
12. Quality assurance
13. Commands
14. Production build and deployment
15. Troubleshooting
16. Where the documentation lives

---

## 1. Modules

| Module | Purpose |
| --- | --- |
| Authentication | Two-step email and login-code flow with protected admin routes |
| Dashboard | User, administrator and report counters, read from `/system/status` |
| Users | Search, filter and page through accounts on the server; inspect profiles and warning history, edit account fields, warn, block, unblock, or delete |
| Comments | Every comment with its answers nested underneath, plus the report queue — edit or hide the text, delete it, and act on reported content from the queue itself |
| Lectures & Professors | Edit and remove lectures and professors, reassign who teaches what, and remove individual ratings |
| Bug Reports | Review submitted problems, rewrite the title or description, update status or severity, delete, and open a GitLab issue |
| Audit Logs | Filter and inspect administrative actions, including before/after values, and undo a field edit |
| Activity Log | Filter and inspect what users did in the student app, plus every refused request |
| Help | In-panel guidance |

Answers are replies to a comment, not a separate top-level feed, so they have no
screen of their own: they are fetched, edited, hidden and deleted from the
Comments screen, and their reports share its report queue.

Engineering characteristics:

- A responsive interface built with Mantine.
- A shared, typed API client with consistent error handling.
- Feature-based source organization with small, focused components and hooks.
- Route-level lazy loading to keep the initial JavaScript download small.
- Unit and integration tests with Vitest and Testing Library.

## 2. Technology stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript, React Router 7, Mantine 9, Tabler Icons |
| Build tooling | Vite 8, TypeScript compiler |
| Tests | Vitest 4, Testing Library, jsdom |
| Code quality | ESLint, TypeScript strict checks |
| Containers | Multi-stage Docker build + Nginx (production image, built in CI/CD) |

Node.js 24 is recommended because it matches the version used by the Docker
build.

## 3. System architecture

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
backend directly, same-origin.

Both arrangements are same-origin from the browser's point of view, which is
deliberate: development exercises the same request topology as production
instead of a second one that only exists on developer machines.

## 4. Quick start

**Prerequisites:** Node.js 24 and npm, plus a reachable backend.

```bash
npm ci
```

Point the dev proxy at your backend in `.env`. The panel calls `/api`, and the
dev server forwards that to `VITE_API_TARGET`:

```env
VITE_API_BASE_URL=/api
VITE_API_TARGET=https://your-backend.example.org
```

```bash
npm run dev
```

Open `http://localhost:5173` and sign in with one of the admin addresses. The
backend emails a six-character login code, which expires after five minutes.

Because the dev server proxies the API, the browser makes same-origin requests
and CORS never enters into it. If you would rather point `VITE_API_BASE_URL`
straight at an absolute backend URL, add the panel's origin
(`http://localhost:5173`) to the backend's `ADMIN_FRONTEND_ORIGINS` first —
without it the backend answers `403 Invalid CORS request` to the preflight and
no request reaches a controller.

### A short walkthrough

1. Sign in with an admin address and the emailed code.
2. Review the system summary and recent registrations on the dashboard.
3. Open **Users**, select a profile, edit a field, inspect its moderation history.
4. Open **Comments**, hide a comment from the content tab, then work its report
   from the reports tab.
5. Open **Bug Reports** and update a report's status or severity.
6. Open **Audit Logs** and locate the actions performed in the previous steps.
7. Inspect an audit event to compare its before and after values.
8. Open **Activity Log** to see what students did and what the backend refused.
9. Sign out and verify that protected routes return to the login page.

State-changing operations are recorded in the audit log **only when they
succeed**, which is what makes the last steps a useful demonstration of both the
UI and the data model.

## 5. Configuration

Vite reads `VITE_API_BASE_URL` when the development server starts or the
production bundle is built. It is the path or URL the panel calls; `/api` means
"whatever is serving this page", which is what keeps requests same-origin.

| Variable | Read by | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | The bundle | Path or URL every request is prefixed with |
| `VITE_API_TARGET` | The dev server only | Backend the `/api` proxy forwards to |
| `VITE_BASE_PATH` | The build | URL path the panel is served from (`/admin/` for builds, `/` for the dev server) |

`VITE_API_TARGET` never reaches the browser — it configures the proxy in
`vite.config.ts` and has no effect on a production build.

`.env` is the only environment file: it is what `npm run dev` reads. A real
environment variable takes precedence over it, which is how the Docker build and
the CI pipeline bake an absolute `VITE_API_BASE_URL` into the production bundle
without editing `.env`. Values are read at startup or build time, so restart the
Vite server after changing them.

## 6. Project structure

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
│   ├── catalog/
│   ├── comments/
│   ├── dashboard/
│   ├── feedback/
│   ├── help/
│   ├── moderation/   Content and report screens shared by comments and answers
│   └── users/
├── hooks/        Reusable hooks without feature ownership
├── layouts/      Authenticated application shell and navigation
├── test/         Shared test setup and HTTP test helpers
└── utils/        Small, reusable utility functions
```

Each feature keeps its page, feature-specific components, hooks, and tests
together. Shared code is moved to a top-level folder only when more than one
feature owns the same responsibility.

## 7. Authentication and authorization

Signing in has two steps:

1. `POST /auth/request-login` validates a KIT student email and emails a
   six-character login code.
2. `POST /auth/login` exchanges the email and code for an `authToken`.

The frontend stores the authenticated session locally and the shared API client
sends the token on protected requests:

```http
Authorization: Bearer <authToken>
```

A stored token is a claim, not proof — it can be revoked while the tab is closed
— so on load the panel confirms it with `GET /auth/me` before treating the
session as valid, and holds protected routes on a loading state until it
answers. A `401` from any request ends the session and returns to the login
screen, which says the session expired rather than presenting a bare form. The
path that was being visited travels with the redirect, so signing in again
returns there instead of the dashboard.

A backend that is merely **unreachable** does *not* end the session: being unable
to confirm a token says nothing about whether it is still good, and signing an
admin out over a dropped connection would lose their place for no reason.

### Who may sign in

The panel is limited to the admin team. `src/utils/adminAccess.ts` holds those
addresses, and the login form checks the address **before** requesting a code: an
address outside the list is answered with "You do not have access to this panel"
and no code is ever sent. The check runs again before the code is exchanged,
because the address can be edited between the two steps.

To add or remove an administrator, edit that list and the backend's
`ADMIN_BOOTSTRAP_EMAILS` together — the frontend decides who is offered a code,
the backend decides who is actually authorized.

### The elevated operator

One address is additionally allowed to **moderate other admin accounts** — warn,
block, unblock, delete, and change an admin's status. The panel does not decide
this and keeps no list of its own: the backend resolves it from
`ADMIN_SUPERUSER_EMAILS` and reports it as `isSuperAdmin` on `/auth/me`, which is
the only thing the panel reads.

It stays a **behavioural** permission, not a role: the account is reported and
rendered as `ADMIN` everywhere, `UserRole` remains `'STUDENT' | 'ADMIN'`, and
there is no badge or label for it. Everything else — a username, biography,
credibility score or a demotion to `STUDENT` — is accepted from any admin, and
nobody moderates their own account.

This client-side gate is a **usability boundary, not a security one**. The
backend independently validates the token and requires an `admins` row for every
protected endpoint; a valid non-admin token is answered with `403` regardless of
what the frontend does.

## 8. API reference

Unless stated otherwise, endpoints require an authenticated administrator token.
The backend repository's `docs/admin-api.md` is the authoritative contract; this
is the subset the panel calls.

### Health and authentication

| Method | Path | Description | Auth |
| --- | --- | --- | --- |
| `GET` | `/health` | API health status | No |
| `POST` | `/auth/request-login` | Request a login code for `{ "email": "..." }` | No |
| `POST` | `/auth/login` | Exchange `{ "email": "...", "loginToken": "..." }` for an `authToken` | No |
| `POST` | `/auth/logout` | Revoke the current token | Admin |
| `GET` | `/auth/me` | Current session; reports `user` as `{ id, username, kitEmail, role, status, isSuperAdmin }` | Any |

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

Changing `kitEmail` revokes the account's sessions, and demoting an admin revokes
them too. An admin account can only be warned, blocked, unblocked or deleted by
the elevated operator, and nobody may do any of it to themselves — the panel
hides the buttons accordingly.

The listing parameters mirror the log endpoints: `limit` is 1–100 (the panel asks
for 50), `cursor` continues the previous page, `q` searches name and email,
`status` is `ACTIVE`/`INACTIVE`/`BLOCKED`, `role` is `ADMIN`/`STUDENT` and `sort`
is `newest`/`oldest`. **Passing any of them changes the ordering**: the listing is
administrators-first only on an unparameterised call, and strictly newest-first
otherwise, because role is not a column to sort on. A bad parameter is a `400`
with a usable message (`A cursor requires a limit`, `Invalid user status`), which
the panel shows verbatim.

A warning carries its own `id`, and `createdFrom` is `{ id, name, createdAt }`
where `id` is the issuing admin's **student** id — the same value `/auth/me`
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

A report's own `id` addresses the report — its status and its withdrawal. The
`commentId` / `answerId` beside it addresses the content the report is about,
which is what the reports tab edits, hides or deletes.

Report statuses are `OPEN`, `REVIEWED`, `DISMISSED`, and `ACTION_TAKEN`.
`ACTION_TAKEN` is the only status that means the content was moderated, so it is
the only one that hides it; any other status puts it back. Hiding keeps the
content in the database — deleting does not.

### Lectures, professors and ratings

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/data/lectures` | List lectures with their professors and counts |
| `PATCH` | `/data/lectures/:id` | Edit `name`, `code`, `semesterYear`, `semesterSeason`, `active`, `lectureType`, `professorIds` |
| `DELETE` | `/data/lectures/:id` | Delete the lecture with its comments, answers and ratings |
| `GET` | `/data/professor` | List professors with their average rating and `lectureIds` |
| `PATCH` | `/data/professor/:id` | Edit `firstName`, `lastName`, `active`, `lectureIds` |
| `DELETE` | `/data/professor/:id` | Delete the professor; the lectures stay |
| `GET` | `/ratings` | List individual ratings; takes `limit`, `cursor` and `lectureId` |
| `DELETE` | `/ratings/:id` | Delete one rating |

`professorIds` and `lectureIds` replace an assignment wholesale — send `[]` to
clear it. `averageRating` comes back as `0` rather than `null` for a professor
nobody has rated, so `ratingCount` is what separates "rated badly" from "not
rated"; the panel shows a dash for the latter.

A rating is someone's actual opinion, so the Ratings tab is read-and-delete:
there is no edit call, by design. `scores` is read as an open map, because which
categories a rating carries depends on the lecture's type.

### Bug reports

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/reports` | List bug reports, each with `issueUrl` and `issueState` |
| `PATCH` | `/reports/:id` | Update any of `status`, `severity`, `title`, `description` |
| `DELETE` | `/reports/:id` | Delete a bug report |
| `POST` | `/reports/:id/gitlab-issue` | Open a GitLab issue for the report; idempotent |

Severities are `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`; statuses use the same values
as content reports. `issueState` is `NONE`, `CREATED` or `FAILED`, and `issueUrl`
is set once an issue exists. Creating one is idempotent — a double press, two
admins on the same queue, or a retry after a timeout all get the existing issue
back. The endpoint answers `503` until the backend is given `GITLAB_BASE_URL`,
`GITLAB_PROJECT_ID` and `GITLAB_TOKEN`, so the panel hides the control while
`/system/status` reports `gitlabEnabled: false`.

### Audit logs and activity log

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/audit-logs` | Filtered, cursor-paginated administrative history |
| `GET` | `/audit-logs/meta` | Actors, actions, target types and actor types for that log |
| `POST` | `/audit-logs/:id/revert` | Undo the field edit an entry recorded |
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

Every audit entry also reports whether it can be undone: `revertible`,
`revertBlockedReason` and `revertedByAuditId`. Only field edits are revertible —
a creation, a deletion or a sign-in records that something happened, not what it
contained. A refused revert is a `409` whose `reason` is one of
`ACTION_NOT_REVERTIBLE`, `WINDOW_EXPIRED`, `VALUE_CHANGED`, `ALREADY_REVERTED` or
`TARGET_MISSING` — the same vocabulary `revertBlockedReason` uses, so the hidden
button and the refused one are explained the same way. The success body is
`{ message, success }` and nothing else, so the panel **re-reads** the log
afterwards: that is where the reversal's own entry appears.

The filter dropdowns are built from the metadata endpoints, so an action added by
the backend appears without a frontend release. `actors` is capped rather than
exhaustive — every account that ever signed in is an actor in the activity log —
so `q` is what finds someone beyond the cap.

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
`lastWrite` are `null` unless the database answered; the dashboard treats that as
a reading it does not have rather than as a reading of zero.

`counts` is read as an open map, so a counter the backend adds renders without a
frontend release. The panel reads `users`, `activeUsers`, `admins`,
`openBugReports`, `openCommentReports` and `comments` from it: the dashboard and
the Users page take their figures from here rather than counting rows, which is
what removed two full-table reads every fifteen seconds. `gitlabEnabled` on the
same response is what decides whether the Bug Reports screen offers to open an
issue.

## 9. Known backend gaps

Nearly all of what this section used to list was closed by the backend change of
2026-08-20, which is deployed. What remains is below; the full request text lives
in `docs/backend-tasks.md` in the repository, which is the file handed to the
backend team.

| Gap | Effect on the panel |
| --- | --- |
| A session that ends on **TTL expiry** writes no `ADMIN_LOGOUT` | The pair closes on an explicit sign-out, and a session the backend revokes itself is recorded on the action that caused it (`USER_UPDATED` with `metadata.sessionsRevoked`). Pure TTL expiry has no actor and no request, so nothing is written. A missing `ADMIN_LOGOUT` is normal and does **not** mean the session is still live. |
| `GET /users` orders differently with and without parameters | Unparameterised it is admins first, then newest. Any paginated call is strictly newest-first. The Users page changes order the moment it paginates. |
| GitLab issue creation is inert until it is configured | Without `GITLAB_BASE_URL`, `GITLAB_PROJECT_ID` and `GITLAB_TOKEN` the backend reports `gitlabEnabled: false` and the endpoint answers `503`. The panel hides the control rather than offering one that cannot work. |
| `/system/status` has **no total bug report counter** (F1) | `counts.openBugReports` is the open ones only. The dashboard's "of N bug reports" sub-line and its "Reports handled" percentage were removed rather than kept by reading the whole `/reports` table on a timer. |
| `/system/status` has **no blocked account counter** (F2) | `users - activeUsers` is blocked *plus* inactive, so blocked cannot be derived; with the Users table paginated it cannot be counted on screen either. That stat card is not shown. |
| A bug report has **no `statusChangedAt`** (F3) | It carries `reportedAt` only, so the Bug Reports History tab can show when a report was *filed* but not when it was closed. |
| The catalogue reads return **active records only** (G1) | `GET /data/lectures` and `GET /data/professor` filter on `active = true`, but both `PATCH` routes accept `active` — so switching a lecture or professor off removes it from the only list the panel can read. The edit forms warn before the switch is saved; an All/Active/Inactive filter waits on the backend. |

Two contract details worth knowing rather than rediscovering: `counts.admins`
counts accounts holding the role, not the allowlist — an address in the backend's
bootstrap list is re-promoted on the next restart or sign-in, so demoting it in
the panel does not stick until the address leaves that configuration. And
`POST /users/{id}/warnings` accepts the old `userID` + `createdFrom` body
permanently, not as a temporary shim, so the two repositories deploy in any
order.

## 10. Audit log design

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
    "status": { "before": "ACTIVE", "after": "BLOCKED" }
  },
  "metadata": {}
}
```

One table holds both logs, split by the scope an action belongs to.
`/audit-logs` serves what admins did through the panel — sign-in and sign-out,
user edits, warnings, blocks and deletions, content and report moderation, bug
report changes, and catalogue edits. `/activity-logs` serves what students did in
the app (`USER_LOGIN`, `COMMENT_CREATED`, `RATING_SUBMITTED`, …) plus the two
refusals, `LOGIN_REFUSED` and `ACCESS_REFUSED`. The split is by action rather
than by actor, so a refused admin login sits next to every other refusal.
`src/domain/auditLog.ts` holds both vocabularies.

For student activity, `changes` is empty — nothing existing was modified — and
`metadata` carries the detail, such as the first 120 characters of the submitted
text.

Audit entries contain snapshots of their actor and target labels, so they remain
understandable even if the original user or report is later deleted. Every
successful state change and its audit event are written in the same database
transaction, preventing one from being saved without the other. Pagination uses
an opaque cursor rather than a page number, which is stable when new events are
inserted while an administrator is browsing older records.

## 11. Lazy loading and code splitting

Lazy loading means downloading code only when it is needed. Without it, the
browser must download the JavaScript for every admin page before showing even the
login screen.

The project uses `React.lazy`, dynamic `import()`, and `Suspense` at route
boundaries:

- The login page and the authenticated application layout are separate chunks.
- Dashboard, Users, Comments, Lectures & Professors, Bug Reports, Audit Logs,
  Activity Log and Help are separate page chunks.
- `PageLoader` provides feedback while a requested chunk is loading.

The initial production bundle therefore contains only the application shell and
shared dependencies. Visiting a module downloads that module's code and the
browser caches it for later visits. This is about frontend JavaScript only — API
data is already loaded independently by the relevant feature hooks.

## 12. Quality assurance

Run the complete local quality gate before submitting changes:

```bash
npm run check
npm test
npm run build
```

The checks cover ESLint rules and React hook usage; TypeScript compilation; unit
tests for utilities, domain rules, API services, hooks and authentication;
integration tests for routing and the main feature pages; and a production build
including Vite's route chunk generation.

Tests stub `fetch` with controlled HTTP responses, so the suite runs without a
backend. As of 2026-09-08 it is **33 test files and 244 tests** — 24 unit files
(136 tests) and 9 integration files (108 tests). The scope, the per-area coverage
matrix, the known automation gaps and the manual end-to-end scenarios are in
`docs/testplan.md`; executed results and defects are in `docs/testfindings.md`.

## 13. Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start Vite using `.env` |
| `npm run build` | Type-check and create the production bundle |
| `npm run preview` | Preview the built `dist/` directory |
| `npm run check` | Run lint and type checking |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run the TypeScript compiler |
| `npm test` | Run all tests once |
| `npm run test:unit` | Run unit tests only |
| `npm run test:integration` | Run integration tests only |

## 14. Production build and deployment

```bash
npm ci
npm run build
```

The deployable files are written to `dist/`; `npm run preview` inspects them
locally. Two values are embedded into the frontend during the build and cannot be
changed afterwards without rebuilding:

| Variable | Meaning | Default |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Backend the panel calls | `/api` |
| `VITE_BASE_PATH` | URL path the panel is served from | `/admin/` for builds, `/` for the dev server |

The repository's multi-stage `Dockerfile` builds one runtime target, `web-prod`:
the compiled frontend served under `VITE_BASE_PATH` with no upstream dependency.
That is the deployable image. The panel is served from `/admin/` on the same host
as the backend, so browser requests to the API are same-origin and need no CORS
handling.

Deployment is driven by CI/CD (`.gitlab-ci.yml`):

1. `web:image` builds the `web-prod` target with Kaniko and pushes it to this
   project's GitLab Container Registry (`$CI_REGISTRY_IMAGE:latest` and
   `:$CI_COMMIT_SHORT_SHA`) whenever `main` gets a new commit.
2. `web:deploy` is a **manual** job on `main` that SSHes into the deployment
   host, pulls that image, and restarts the `admin-web-prod` container. Trigger
   it from the pipeline view in GitLab when you want the change live.

If the registry or CI is unreachable, `scripts/deploy-prod.ps1` is a fallback
that builds and runs the image directly on the deployment host's Docker daemon
over SSH — no local Docker daemon or registry needed:

```powershell
pwsh scripts/deploy-prod.ps1
```

The container publishes on the loopback interface only. The host's Nginx
terminates TLS and forwards the public path to it, keeping the `/admin/` prefix:

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
release a new version, push to `main` and trigger the manual `web:deploy` job; to
roll back, run `web:deploy` again against an older commit's pipeline.

The production backend is outside this repository and must implement the API
contract documented above. The full deployment guide is `docs/deployment.md` in
the repository.

## 15. Troubleshooting

**The frontend cannot reach the API.** Check the backend's health endpoint with
`curl <api base>/health`. If `VITE_API_BASE_URL` was changed while Vite was
running, restart the development server — the value is read at startup.

**`403 Invalid CORS request` when requesting a login code.** This should not
happen through the dev proxy, which makes requests same-origin. It appears when
`VITE_API_BASE_URL` points straight at an absolute backend URL and the panel's
origin is not in the backend's `ADMIN_FRONTEND_ORIGINS`. The origin has to be
listed even when the panel and the API share a host, because the browser sends
`Origin` on every non-`GET` request. Confirm with:

```bash
curl -i -X POST -H "Origin: <panel origin>" -H "Content-Type: application/json" \
  -d '{"email":"nobody@example.invalid"}' <api base>/auth/request-login
```

`400 Invalid KIT email` means the origin is accepted; `403 Invalid CORS request`
means it is not.

**"You do not have access to this panel".** The address is not in the admin list
in `src/utils/adminAccess.ts`, so no code was requested. Add it there and to the
backend's `ADMIN_BOOTSTRAP_EMAILS`.

**Login succeeds but admin requests return `403`.** The account authenticated but
has no `admins` row on the backend. Admin membership comes from that table, not
from the frontend — check `ADMIN_BOOTSTRAP_EMAILS` and sign in again so the
account is provisioned.

**The login code never arrives.** Codes are delivered over SMTP by the backend
and are never returned in a response or written to a log. Check the backend's
SMTP configuration and its rate limits: requests default to 3 per email and 20
per source IP per 15 minutes, after which the endpoint answers `429` with
`Retry-After`.

## 16. Where the documentation lives

| File | Contents |
| --- | --- |
| `README.md` | The same reference as this page, for readers in the repository |
| `wiki.md` | This page — the copy published to the GitLab wiki |
| `CHANGELOG.md` | What changed and why, per release |
| `docs/TODO.md` | Open work, with a notebook section reserved for the maintainer |
| `docs/backend-tasks.md` | Requests handed to the backend team |
| `docs/testplan.md` | Test scope, coverage matrix and manual scenarios |
| `docs/testfindings.md` | Executed results and defects |
| `docs/deployment.md` | The full deployment guide |
