# Test Plan — Admin Web

How this panel is tested, what the automated suite actually covers, and what has
to be checked by hand against a real backend. Results and defects are recorded in
[testfindings.md](testfindings.md).

## 0. Where the numbers come from

Counts in this document are **derived from a run, and are not the authority**. The
authority is what `npm run test:coverage` writes into `coverage/`, which CI
publishes as an artefact. A count written here is a snapshot with a date on it;
when the two disagree, the artefact is right and this file is stale.

This has been wrong before. The figures recorded on 2026-09-08 — 33 files, 244
tests — had never matched a real run, and were still being copied forward a day
later. Everything below was re-derived from a passing run on **2026-09-09**.

## 1. Scope

In scope: the React admin panel in this repository — routing, authentication and
session handling, the API service layer, domain rules, and every feature page.

Out of scope: the backend itself and the Android client. **No test in this
repository contacts a backend**, so nothing here establishes that the backend
agrees with the panel. Anything that depends on real backend behaviour is a manual
scenario in section 6, and closing that gap by contract is `P1` in
[TODO.md](TODO.md).

## 2. What actually touches HTTP

The previous version of this document said "the suite stubs `fetch`". That is
misleading in a way that matters, so it is stated precisely here instead. There
are **three** levels of substitution in the suite, not one:

| Level | Where it is cut | Files | Tests | What is therefore proven — and what is not |
| --- | --- | --- | --- | --- |
| **Transport stubbed** | `fetch` is replaced, so `ApiClient` and the service run for real | 11 | 83 | The URL, query string, method, body and `Authorization` header a **service** produces. Not that any screen asks for them. |
| **Service replaced** | `vi.mock('@/api/…')`, so no request is constructed at all | 11 | 134 | What a **screen** renders, and which service method it calls with which arguments. Nothing about the wire. |
| **Neither** | Pure functions, models, theme, `HelpPage` | 16 | 68 | Rules in isolation. |

`src/context/AuthContext.unit.test.tsx` appears in the first two rows: it stubs
`fetch` *and* mocks a service, which is why the rows sum to more than 273.

**The consequence, stated plainly: no page test touches HTTP.** What a screen sends
is asserted only in service unit tests, against expectations this same repository
wrote. A field the backend renamed passes every test here and fails in the browser.
That is not hypothetical — it is `F-002`.

`src/test/http.ts` is **not** a fetch stub, despite its name. It is two constants:
`TEST_API_BASE_URL` and a `jsonResponse` helper. Each service unit test installs its
own `fetch` double.

## 3. Test layers

| Layer | Pattern | Files | Tests |
| --- | --- | --- | --- |
| Unit | `*.unit.test.*` | 28 | 160 |
| Integration | `*.integration.test.tsx` | 9 | 113 |
| Routing | `src/App.integration.test.tsx` (one of the 9) | 1 | 20 |
| Static gates | — | — | `npm run lint`, `npm run typecheck`, `npm run build` |

**Total: 37 files, 273 tests, green** (2026-09-09).

A unit test isolates one unit; it is not a scenario. End-to-end scenarios belong in
section 6 and, once `P3` lands, in Playwright.

## 4. Commands

| Command | Description |
| --- | --- |
| `npm run check` | ESLint and the TypeScript compiler |
| `npm test` | The whole suite once |
| `npm run test:unit` | Unit tests only |
| `npm run test:integration` | Integration tests only |
| `npm run test:coverage` | The suite plus the coverage report in `coverage/` |
| `npm run build` | Type-check and produce the production bundle |

The full local gate before submitting a change:
`npm run check && npm test && npm run test:coverage && npm run build`.

## 5. Environment

- **Runner:** Vitest 4 in `jsdom`, configured in `vite.config.ts`
  (`test.environment`, `test.setupFiles`, `test.css: true`).
- **Setup:** `src/test/setup.ts` runs before every file. It installs a
  `ResizeObserver` double, Map-backed `localStorage` and `sessionStorage`, a
  `matchMedia` stub, and stubs `scrollIntoView` and `scrollTo`; `afterEach` cleans
  up and resets the URL.
- **Query client:** pages that use TanStack Query are wrapped in `withQueryClient`
  from `src/test/queryClient.tsx` — retries off, `staleTime: 0`, no refetch on focus.
- **Rendering:** `@testing-library/react` with `user-event`; assertions extended by
  `@testing-library/jest-dom`.
- **Offline and deterministic.** No backend is required and none is contacted.

### Traps that have cost time here

- **Mantine `Select` under jsdom** never lays out its dropdown, so the option stays
  `display: none`. Query it with `{ hidden: true }`.
- **Mantine `Accordion`** hides collapsed panels rather than unmounting them. Assert
  `not.toBeVisible()`, not `not.toBeInTheDocument()`. This was `F-004`.
- **Two `vi.mock` calls for the same barrel** silently overwrite each other. Mock a
  package once, listing every service in it.
- **Fake timers and TanStack Query.** Vitest fakes `queueMicrotask`, which is how the
  query client notifies its observers, so a polled refetch never reaches the
  component. Drive the query client instead of the clock.

## 6. Automated coverage

Coverage as of 2026-09-09: **91.23% statements / 84.16% branches / 89.03% functions
/ 93.49% lines.** Per-directory figures are in
[testfindings.md](testfindings.md#coverage).

### 6.1 API service layer — 10 files, 71 tests

Every service package has a unit test pinning the request shape and the mapping of
the response onto the panel's types, including error paths.

| File | Tests |
| --- | --- |
| `client/ApiClient` | 13 |
| `users/UsersService` | 11 |
| `auth/AuthService` | 10 |
| `feedback/FeedbackService`, `logs/AuditLogsService`, `moderation/CommentsService`, `moderation/AnswersService` | 6 each |
| `catalog/CatalogService` | 5 |
| `catalog/RatingsService`, `system/SystemStatusService` | 4 each |

`ApiClient` carries the cross-cutting rules: the bearer token, `401` ending the
session, and an unreachable backend *not* ending it. `AuthService` covers `/auth/me`
in both the `username`/`kitEmail` and the older `name`/`email` spelling, and an
absent `isSuperAdmin` becoming `false`.

### 6.2 Feature pages — 8 files, 93 tests

| Page | Tests | Notable coverage |
| --- | --- | --- |
| `users/UsersPage` | 25 | Search, filters, cursor paging, the profile modal, warn / block / unblock / delete, and the elevated-operator permission — including that an ordinary admin sees an admin's status locked but the credibility score editable |
| `comments/CommentsPage` | 17 | Reported content, thread expansion, moderation actions across both tabs |
| `catalog/CatalogPage` | 16 | Lecture and professor editing, the warning before a record is switched inactive, a refused save keeping the editor open with what was typed |
| `feedback/FeedbackPage` | 13 | Bug reports, the History tab, the GitLab control when `gitlabEnabled` is false, a refused deletion |
| `audit-logs/AuditLogsPage` | 9 | Rendering and filtering, "Load more" **appending**, a revert re-reading the log, a `404` becoming "deploy the audit endpoints" |
| `dashboard/DashboardPage` | 6 | Stat cards, a partial read keeping the half that arrived, `counts: null` not read as zeros |
| `auth/LoginPage` | 6 | The two-step flow; an address outside the team never reaches `request-login` |
| `help/HelpPage` | 1 | Sections start collapsed and open on click |

### 6.3 Shell, state and shared code — 19 files, 109 tests

| Area | Files | Tests | Coverage |
| --- | --- | --- | --- |
| `src/App.integration.test.tsx` | 1 | 20 | Routing, protected routes, redirect target after sign-in, and that the removed System Status and Activity Log paths fall back to the dashboard |
| `src/context` | 1 | 12 | Session restore, a stored session carrying `isSuperAdmin`, rejection of a malformed one, withdrawal of an elevation `/auth/me` no longer reports |
| `src/theme` | 1 | 8 | That inputs and modals are painted by the theme with no `styles` prop, and that a component-level override lands on top of it |
| `src/features/*/model` | 6 | 32 | `feedback` (8), `catalog/edit` (6), `moderation` (6), `users/userEdit` (5), `catalog/catalog` (4), `catalog/deletion` (3) |
| `src/features/auth` | 2 | 8 | `authenticateAdmin` (6), `loginModel` (2) |
| `src/features/dashboard/hooks` | 1 | 4 | `useDashboardData` |
| `src/utils` | 4 | 13 | `formatDate` (5), `getErrorMessage` (4), `color` (3), `adminAccess` (1) |
| `src/domain` | 2 | 7 | `auditLog` (5), `moderation` (2) |
| `src/components` | 1 | 5 | `ErrorBoundary`, over `react-error-boundary` |

### 6.4 Known automation gaps

Stated so the matrix above is not mistaken for full coverage.

- **No page test touches HTTP.** Section 2. `P2` closes it for one feature.
- **`src/layouts` has no tests.** The authenticated shell and navigation are
  exercised only indirectly, through the routing tests. Function coverage there is
  the weakest in the project.
- **`src/components`** — one tested file out of fourteen. The rest are
  presentational and covered indirectly by the page tests.
- **`src/features/moderation`** — its `model/` is covered; its components and hooks
  are reached only through the comments page.
- **No accessibility assertions anywhere.** `P4`.
- **No end-to-end layer.** `P3`.
- **`src/constants`** — no tests, and none would be useful: the files are literals.

Seven directories are at **100% on all four axes** and are therefore omitted from
the coverage text report entirely, which is worth knowing before reading it as a
list of everything: `src/theme`, `src/hooks`, `src/constants`, `src/features/help`,
`src/api/catalog`, `src/api/moderation`, `src/api/system`.

## 7. Manual and end-to-end scenarios

These need a real backend and a browser. The automated suite cannot establish any
of them. The right-hand column is the binding to `P3`: when a Playwright spec
exists for a scenario, it is named here, so the manual list and the automated list
cannot drift apart.

| ID | Scenario | Expected | Automated by |
| --- | --- | --- | --- |
| E2E-1 | **Elevated operator.** Sign in as `u-kisi4@student.kit.edu`; warn, block, unblock and delete a real admin account; edit its status and credibility score. | Every action succeeds and the audit log records it with the right actor. | — (needs a real backend) |
| E2E-2 | **Ordinary admin against an admin target.** Repeat E2E-1 as a non-elevated admin. | Refused with `409`; status locked in the edit form, credibility score still editable. | — |
| E2E-3 | **Self protection.** Try to block, delete or demote your own account. | The controls are not offered, and the backend refuses the request if made directly. | — |
| E2E-4 | **Session survives a reload.** Sign in, reload the tab. | Still signed in; sidebar shows the real account name, not `Unknown account`. Regression guard for `F-002`. | `P3` — login flow |
| E2E-5 | **Login code round trip.** Request a code with an allowed KIT address, then with one outside the list. | A code arrives for the first; the second is refused with "You do not have access to this panel" and no code is sent. | `P3` — login flow |
| E2E-6 | **Expired or revoked token.** Let the session be revoked, then act. | A `401` ends the session, the login screen says it expired, and the visited path travels in `state.from`. | `P2` — as a handler test |
| E2E-7 | **Backend unreachable.** Stop the backend, reload. | The session is **not** ended; the panel reports the failure instead of signing the admin out. | `P2` — as a handler test |
| E2E-8 | **Catalogue inactive toggle.** Switch a lecture or professor off. | The warning appears before saving, and the record then disappears from the list. See `G1` in [backend-tasks.md](backend-tasks.md). | — |
| E2E-9 | **GitLab issue creation** with `gitlabEnabled: false`. | The control is hidden rather than offered and failing with `503`. | `P2` — as a handler test |
| E2E-10 | **Production build under `/admin/`.** Build and serve the image. | Assets resolve under the base path; deep links and reloads work. See [deployment.md](deployment.md). | — |
| E2E-11 | **Comment moderation.** Set a report to `ACTION_TAKEN`; then to any other status. | The content is hidden, then restored. | `P2` and `P3` — moderation flow |
| E2E-12 | **Bug report status update.** Change a report's status and severity. | The report moves to History and the change survives a reload. | `P3` — bug report flow |
| E2E-13 | **Revert a field edit from the audit log.** | The fields go back, the log is re-read, and the reversal's own entry appears. A non-revertible entry explains why. | `P3` — audit revert flow |

E2E-11 to E2E-13 are new. They are flows `P3` is specified to cover, and the manual
list had no row for any of them — so the binding column would have pointed at
scenarios that did not exist.

## 8. Entry and exit criteria

**Entry:** the branch builds and `npm run check` is clean.

**Exit for a merge:** `npm run check`, `npm test` and `npm run build` pass, coverage
has not fallen, and any scenario in section 7 that the change touches has been run
and recorded.

**Exit for a release:** the above, plus every scenario in section 7 run against the
deployed backend, with each result written into [testfindings.md](testfindings.md).
**A scenario that was not run is recorded as not run**, never assumed to pass.

## 9. Planned changes to this plan

The twelve-phase test strategy this section used to describe has been **replaced**.
Its Phase 1 (coverage infrastructure) landed; the rest is superseded by the packages
in [TODO.md](TODO.md), which are scoped to the time actually available:

| Package | What it adds here |
| --- | --- |
| `P1` | A committed OpenAPI schema and generated types — closes the gap in section 2 by contract |
| `P2` | MSW for the Comments feature, so one page test really sends a request |
| `P3` | Playwright over four flows, bound to section 7 |
| `P4` | `vitest-axe` per route, plus the keyboard and state defects already catalogued |
| `P5` | Coverage thresholds and a published artefact — which is what makes section 0's rule enforceable |

Two decisions changed in the process, and both are recorded as ADRs rather than
edited away here: the contract source is now ranked
([0008](adr/0008-generated-schema-is-the-contract-authority.md)), and MSW is adopted
slice by slice rather than big-bang
([0009](adr/0009-msw-slice-by-slice.md)).

Until those land, sections 2 to 6 describe the suite as it actually is. Nothing in
them is a forecast.

## 10. Recording results

Every executed scenario and every defect gets a row in
[testfindings.md](testfindings.md). Fixes are described in `CHANGELOG.md`; the
finding is then marked resolved and points at the change.
