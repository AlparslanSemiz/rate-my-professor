# Test Plan — Admin Web

How this panel is tested, what the automated suite actually covers, and what has
to be checked by hand against a real backend. Results and defects are recorded
in `docs/testfindings.md`.

Figures below were taken from a passing run and are exact as of 2026-09-08:
**33 test files, 244 tests.**

## 1. Scope

In scope: the React admin panel in this repository — routing, authentication and
session handling, the API service layer, domain rules, and every feature page.

Out of scope: the backend itself and the Android client. The suite stubs `fetch`,
so it verifies what the panel *sends* and how it renders what it *receives*, not
whether the backend agrees. Anything that depends on real backend behaviour is a
manual scenario in section 6.

## 2. Test layers

| Layer | Pattern | Files | Tests | What it establishes |
| --- | --- | --- | --- | --- |
| Unit | `*.unit.test.*` | 24 | 136 | Services, utilities, domain rules, hooks and context in isolation |
| Integration | `*.integration.test.tsx` | 9 | 108 | A page rendered with its real hooks and services against stubbed HTTP |
| Routing | `src/App.integration.test.tsx` | 1 (of the 9) | 19 | Route table, protected routes, redirect-after-login, lazy chunk loading |
| Static gates | — | — | — | `npm run lint`, `npm run typecheck`, `npm run build` |

## 3. Commands

| Command | Description |
| --- | --- |
| `npm run check` | ESLint and the TypeScript compiler |
| `npm test` | The whole suite once |
| `npm run test:unit` | Unit tests only |
| `npm run test:integration` | Integration tests only |
| `npm run build` | Type-check and produce the production bundle |

The full local gate before submitting a change is `npm run check && npm test &&
npm run build`.

## 4. Environment

- **Runner:** Vitest 4 in a `jsdom` environment, configured in `vite.config.ts`
  (`test.environment`, `test.setupFiles`, `test.css: true`).
- **Setup:** `src/test/setup.ts` runs before every file.
- **HTTP:** `src/test/http.ts` stubs `fetch` with controlled responses. **No
  backend is required and none is contacted** — the suite is deterministic and
  runs offline.
- **Rendering:** `@testing-library/react` with `@testing-library/user-event`;
  assertions extended by `@testing-library/jest-dom`.

## 5. Automated coverage

### 5.1 API service layer — 11 files, 76 tests

Every service in `src/api` has a unit test. They pin the request shape (method,
path, query, body, `Authorization` header) and the mapping of the response onto
the panel's types, including error paths.

| File | Tests |
| --- | --- |
| `ApiClient.unit.test.ts` | 13 |
| `UsersService.unit.test.ts` | 11 |
| `AuthService.unit.test.ts` | 10 |
| `AnswersService` / `AuditLogsService` / `CommentsService` / `FeedbackService` | 6 each |
| `ActivityLogsService` / `CatalogService` | 5 each |
| `RatingsService` / `SystemStatusService` | 4 each |

`ApiClient` carries the cross-cutting rules: the bearer token, `401` ending the
session, and an unreachable backend *not* ending it. `AuthService` covers
`/auth/me` in both the `username` / `kitEmail` and the older `name` / `email`
spelling, and an absent `isSuperAdmin` becoming `false`.

### 5.2 Feature pages — 8 files, 89 tests

| Page | Tests | Notable coverage |
| --- | --- | --- |
| `users/UsersPage` | 25 | Search, filters, pagination, the profile modal, warn / block / unblock / delete, and the elevated-operator permission — including that an ordinary admin sees an admin's status locked but the credibility score editable |
| `comments/CommentsPage` | 17 | Reported content, thread expansion, moderation actions |
| `catalog/CatalogPage` | 14 | Lecture and professor editing, the warning before a record is switched inactive |
| `feedback/FeedbackPage` | 11 | Bug reports, the history tab, the GitLab control when `gitlabEnabled` is false |
| `audit-logs/AuditLogsPage` | 9 | Actor / action / target rendering and filtering |
| `activity-logs/ActivityLogsPage` | 6 | Filtering and paging |
| `dashboard/DashboardPage` | 6 | Stat cards and their loading and error states |
| `help/HelpPage` | 1 | Renders |

### 5.3 Shell, state and shared code — 14 files, 79 tests

| Area | Files | Tests | Coverage |
| --- | --- | --- | --- |
| `src/App.integration.test.tsx` | 1 | 19 | Routing, protected routes, redirect target after sign-in |
| `src/context` | 1 | 12 | Session restore, a stored session carrying `isSuperAdmin`, rejection of a malformed one, withdrawal of an elevation `/auth/me` no longer reports |
| `src/features/*` unit | 3 | 14 | `authenticateAdmin` (6), `catalogModel` (4), `useDashboardData` (4) |
| `src/utils` | 4 | 13 | `formatDate` (5), `getErrorMessage` (4), `color` (3), `adminAccess` (1) |
| `src/hooks` | 2 | 9 | `useVisibleInterval` (7), `useAsyncData` (2) |
| `src/domain` | 2 | 7 | `auditLog` (5), `moderation` (2) |
| `src/components` | 1 | 5 | `ErrorBoundary` |

### 5.4 Known automation gaps

Stated so the matrix above is not mistaken for full coverage. None is urgent;
they are carried as a follow-up in `docs/TODO.md`.

- `src/layouts` — no tests. The authenticated shell and navigation are exercised
  only indirectly, through the routing tests.
- `src/components` — one tested file out of fourteen. The rest are presentational
  and are covered indirectly by the page tests.
- `src/features/moderation` — no tests of its own; covered through the comments
  and answers pages.
- `src/constants` — no tests, and none are useful: the files are literals.
- `src/utils/adminAccess.unit.test.ts` is down to a single test. The
  `isSuperAdminEmail` suite went away with the function when the permission moved
  to the backend; what remains is the `withRequiredAdminRole` case.

## 6. Manual and end-to-end scenarios

These need a real backend and a browser. The stubbed suite cannot establish any
of them.

| ID | Scenario | Expected |
| --- | --- | --- |
| E2E-1 | **Elevated operator.** Sign in as `u-kisi4@student.kit.edu`; warn, block, unblock and delete a real admin account; edit its status and credibility score. | Every action succeeds, and the audit log records it with the right actor. Blocked for the panel's Blocking item in `docs/TODO.md`. |
| E2E-2 | **Ordinary admin against an admin target.** Repeat E2E-1 as a non-elevated admin. | Refused with `409`; status locked in the edit form, credibility score still editable. |
| E2E-3 | **Self protection.** Try to block, delete or demote your own account, elevated or not. | The controls are not offered, and the backend refuses the request if it is made directly. |
| E2E-4 | **Session survives a reload.** Sign in, reload the tab. | Still signed in, sidebar shows the real account name — not `Unknown account`. Regression guard for F-002. |
| E2E-5 | **Login code round trip.** Request a code with an allowed KIT address; then with an address outside the list. | A code arrives for the first; the second is answered with "You do not have access to this panel" and no code is sent. |
| E2E-6 | **Expired or revoked token.** Let the session be revoked, then act. | A `401` ends the session and the login screen says the session expired, keeping the visited path for the redirect back. |
| E2E-7 | **Backend unreachable.** Stop the backend, reload. | The session is *not* ended; the panel reports the failure instead of signing the admin out. |
| E2E-8 | **Catalogue inactive toggle.** Switch a lecture or professor off. | The warning appears before saving, and the record then disappears from the list — the behaviour G1 in `docs/backend-tasks.md` exists to fix. |
| E2E-9 | **GitLab issue creation.** With `gitlabEnabled: false`. | The control is hidden rather than offered and failing with `503`. |
| E2E-10 | **Production build under `/admin/`.** Build and serve the image. | Assets resolve under the `/admin/` base path; deep links and reloads work. See `docs/deployment.md`. |

## 7. Entry and exit criteria

**Entry:** the branch builds, and `npm run check` is clean.

**Exit for a merge:** `npm run check`, `npm test` and `npm run build` all pass,
and any scenario in section 6 touched by the change has been run and recorded.

**Exit for a release:** the above, plus every E2E scenario run against the
deployed backend, with each result written into `docs/testfindings.md` — a
scenario that was not run is recorded as not run, not assumed to pass.

## 8. Planned changes to this plan

A twelve-phase test strategy is agreed but **not started** — a refactor comes
first. It adds measured coverage with enforced thresholds, MSW in place of the
`fetch` stubs, page tests that assert the request as well as the render, contract
tests against the backend schema, a thin Playwright E2E layer, mutation testing
and accessibility checks. The phases, their decisions and their acceptance
criteria are in `docs/TODO.md` under "Test strategy".

Until those phases land, the coverage matrix in section 5 describes the suite as
it actually is. Nothing in it is a forecast.

## 9. Recording results

Every executed scenario and every defect gets a row in `docs/testfindings.md`.
Fixes are described in `CHANGELOG.md`; the finding row is then marked resolved
and points at the change.
