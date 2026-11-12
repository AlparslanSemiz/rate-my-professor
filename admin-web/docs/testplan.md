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
| **Nothing** | MSW answers the real request, so the screen, its hooks, its services and `ApiClient` all run | 8 | 113 | The path, method, query string, JSON body and the `Authorization` and `Content-Type` headers a **screen** produces, and what it renders from the answer. |
| **Transport stubbed** | `fetch` is replaced, so `ApiClient` and the service run for real | 10 | 71 | The request a **service** produces. Not that any screen asks for it. |
| **Service replaced** | `vi.mock('@/api/…')`, so no request is constructed at all | 5 | 49 | What a **screen** renders, and which service method it called. Nothing about the wire. |
| **Neither** | Pure functions, models, theme, `HelpPage`, the error hierarchy | 20 | 115 | Rules in isolation. |

**Counts are a dated snapshot, per section 0.** These four were derived on 2026-09-09
by running each group of files and reading the totals, and the groups were checked for
overlap — no file appears in two of them. The authority for coverage is `coverage/`.

**Eight files now touch HTTP**, which is the sentence this section previously could
not write. Named explicitly, because "some of them" is how a claim like this rots:

| File | What only a real request could prove |
| --- | --- |
| `src/App.integration.test.tsx` | The identity comes from `/auth/me` and nowhere else — asserted as *no request went to the user list*, not as *a function was not called*. |
| `src/context/AuthContext.integration.test.tsx` | A `401` ends the session, a transient failure does not, and a `404` is reported without ending it (`F-013`). |
| `src/layouts/AdminLayout.integration.test.tsx` | The shell's own notice, and that focus returns to the main landmark when it is dismissed. |
| `src/features/auth/LoginPage.integration.test.tsx` | The admin-team check stops a code being *requested* — provable only as an absent request. |
| `src/features/comments/CommentsPage.integration.test.tsx` | `ACTION_TAKEN` hides content and every other status restores it, which needs the answer to the *next* request. |
| `src/features/users/UsersPage.integration.test.tsx` | `q`/`status`/`role`/`sort` applied server-side, and block/unblock writing back. |
| `src/features/audit-logs/AuditLogsPage.integration.test.tsx` | The one screen that filters server-side: the query string a mock never built. |
| `src/api/client/bodylessWrites.integration.test.ts` | That five writes send **no `Content-Type`** — a header that only exists once a request is built (`F-023`). |

They run against handlers that implement the contract — the envelope, cursor paging that
really slices, `q`/`status`/`role`/`sort` applied, and the error paths. `F-002` — a
field the backend had renamed — is the class of defect this closes, and it lived in
exactly the gap between a service test's expectations and what a screen actually
sends.

**Five files still replace their service**, and that is a decision rather than a
backlog. Named too, for the same reason:

| File | Replaces | What it therefore cannot show |
| --- | --- | --- |
| `src/features/catalog/CatalogPage.integration.test.tsx` | `@/api/catalog` | Anything about the catalogue's requests. There are no catalogue handlers at all. |
| `src/features/feedback/FeedbackPage.integration.test.tsx` | `@/api/feedback`, `@/api/system` | The GitLab escalation's request — which is why `F-023` had to exercise it at the service layer. |
| `src/features/dashboard/DashboardPage.integration.test.tsx` | `@/api/auth`, `@/api/system`, `@/api/users` | That the two reads are independent for the reason claimed. |
| `src/features/dashboard/hooks/useDashboardData.integration.test.tsx` | `@/api/system`, `@/api/users` | Same. |
| `src/features/auth/authenticateAdmin.unit.test.ts` | `@/api/auth` | Nothing — it isolates one function, which is what a unit test is for. |

Catalogue, feedback and the dashboard were not touched by the work that prompted the
migration, and the last row is a unit test doing its job.
[ADR 0009](adr/0009-msw-slice-by-slice.md) records the rule — a module being worked
on moves; a module nobody is touching stays.

`src/test/http.ts` is **not** a fetch stub, despite its name. It is two constants:
`TEST_API_BASE_URL` and a `jsonResponse` helper. Each service unit test installs its
own `fetch` double.

## 3. Test layers

| Layer | Pattern | Files | Tests |
| --- | --- | --- | --- |
| Unit | `*.unit.test.*` | 28 | 182 |
| Integration | `*.integration.test.*` | 21 | 1025 (+3 skipped) |
| Routing | `src/App.integration.test.tsx` (one of the 21) | 1 | 20 |
| End-to-end | `e2e/*.spec.ts`, Playwright, `npm run test:e2e` | 15 | 233 |
| Static gates | — | — | `npm run lint`, `npm run check:cycles`, `npm run check:docs`, `npm run typecheck`, `npm run build` |

**Total: 49 files, 1207 tests and 3 skipped, green** (2026-09-10, after the
release-readiness audit), plus **15 Playwright specs, 233 tests** in the end-to-end
layer, which run separately and are not counted in the Vitest total. Coverage
**93.1 / 86.66 / 91.56 / 94.76**.

The audit added one integration file (`WarnForm.integration.test.tsx`, the first
component test for a surface only a modal can reach), one Playwright spec
(`document-head.spec.ts`) and one route sweep inside the existing accessibility file.

The paragraph below is about the round before it, and its point still holds: the unit
count did not move at all — 28 files, 182 tests, exactly as before. Every one
of the 792 new tests is an integration test, because every layer added this round asks
what happens when two things meet: a service and a response, a screen and a payload, a
rendered tree and axe. The three skipped are the list-cardinality cases on the dashboard,
whose read answers with an object rather than a list.

Per section 0, these are a dated snapshot and **`coverage/` is the authority**. One
caveat belongs with them rather than in a footnote: `npx vitest run .integration.test.`
reported a single failure once and was green on the nine runs that followed, with the
failing test never identified (`F-024` in
[testfindings.md](testfindings.md)). A suite that fails once in ten is not a green
suite, and the number above is worth less than this sentence.

A unit test isolates one unit; it is not a scenario. End-to-end scenarios belong in
section 6 and, once `P3` lands, in Playwright.

**Four files that were not unit tests have been renamed.** `AuthContext`,
`useDashboardData`, `theme` and `ErrorBoundary` each render a React tree and drive
it, so each is `.integration.` now; the two scripts filter on the filename, so the
name was the only thing deciding which suite they belonged to. The split moved from
207/113 to 178/143, which is what it should have said all along.

**Two remain arguable and are left alone.** `authenticateAdmin.unit.test.ts` and
`users/model/userEdit.unit.test.ts` each exercise a second module that has its own
file. They are still module-level tests of one function, so renaming them would
say something untrue in the other direction.

**Two static gates are new.** `check:cycles` walks every import in `src/` and fails
on a cycle — the claim in [class-diagram.md](class-diagram.md) had been verified
once, by hand, and only between packages. `check:docs` fails when a public service,
hook or domain type has no doc comment. Both were verified by making them fail.

## 3a. The five layers of this round

Read this beside `docs/test-plan.md` in the backend repository. That one opens
`Layers: **unit → API/role → contract → integration → E2E**`; this one is

**call surface → contract → resilience → accessibility → real browser → end-to-end**

and the two lists are **deliberately not the same**. The backend's layers answer the questions a
Spring application has; the panel has different ones, and copying five names across would have
produced a document that read well and measured nothing. [ADR
0015](adr/0015-panel-test-layers-answer-the-panels-own-questions.md) records why, and which
question each layer here corresponds to.

The rule for reading this table is that the third column is as load-bearing as the second. A
layer that does not say what it fails to answer is claiming everything.

| Layer | The question it answers | What it does **not** answer | Tool | State |
| --- | --- | --- | --- | --- |
| **1 — Call surface** | What did the panel actually send? Path, verb, `Authorization`, whether a `Content-Type` was set at all, body fields, query string — for every one of the **44** endpoints. | Whether the backend agrees with any of it. That needs the schema. | Vitest + MSW + the request recorder; the endpoint list discovered from `src/api/**` by `import.meta.glob`, never hand-written | **Done.** `src/api/callSurface.integration.test.ts`, 58 tests |
| **2 — Contract** | Do the panel's types match the backend's own OpenAPI document? | Everything. | `openapi-typescript` through `npx` | **Not built.** `docs/api/openapi.json` is not in this repository; see [ADR 0008](adr/0008-generated-schema-is-the-contract-authority.md) |
| **3a — Resilience, service layer** | What does the panel raise when the backend misbehaves? Nine failing statuses, a network error, an empty body, a body that is not JSON, a `2xx` refusal, and `204 No Content` — per endpoint. | Whether the backend ever behaves that way, and what a *screen* does with the answer. | Vitest + MSW, driving services directly | **Done.** `src/api/responseShapes.integration.test.ts`, 617 tests — the count is derived, so the two activity endpoints appeared here without a line being written |
| **3b — Resilience, screen layer** | What does a screen do with a payload that parsed cleanly and is still wrong? Every read field removed one at a time, nested objects nulled, scalars given the wrong type, lists of 0/1/3, a slow read. | **Detail views** — still, at this layer. It answers for list reads only. Layer 4 now opens every modal (`e2e/surfaces.spec.ts`), so the gap is narrower than it was and is *not* closed: a missing **field** inside a detail view is caught by nothing, because that spec measures layout, naming and focus rather than payloads. | Vitest + MSW + React Testing Library, with a boundary that records crashes | **Done.** `src/features/degradedPayloads.integration.test.tsx`, 136 tests + 3 skipped, over 7 screens |
| **4 — Real browser** | Does it fit, does focus behave, are the targets big enough, and what is the contrast? Everything jsdom answers *wrongly* rather than not at all. | Anything **at or below 768px** — see `F-019`; 800 is now measured. And most of the contrast question *on the routes*, which axe cannot decide against a gradient (`F-035`) — though inside a modal it can, and does (`F-038`). Payload shapes: this layer measures pixels and focus, not fields. | Playwright + `@axe-core/playwright`, Chromium | **Done.** `e2e/layout.spec.ts`, `e2e/focus.spec.ts`, `e2e/a11y.spec.ts`, and since 2026-09-10 `e2e/surfaces.spec.ts` (12 modals and 4 forms at three widths, and whether any of them moves as it opens), `e2e/keyboard.spec.ts`, `e2e/faults.spec.ts` and `e2e/fields.spec.ts` (the five multi-line fields at two widths) — **202 tests** (2026-09-10, re-derived from `npx playwright test --list`: layout **65**, focus 12, a11y 9, surfaces 89, keyboard 4, faults 13, fields 10). Layout grew by 28: every badge's **label** measured against the box it is drawn in, on every route at all three widths, and every panel's right edge recorded across a dialog opening and closing. Both exist because the boxes this layer had been measuring - cells, rows, tables, and the scrollbar gutter - are boxes that cannot report the two defects that were on screen (`F-075`, `F-062`) |
| **5 — Accessibility** | Can the panel be operated without a mouse, and does its markup carry what colour carries? Nine routes under every axe rule that does not need layout. | `color-contrast` and `target-size`, switched off **by name** — every element in jsdom is 0x0. Handed to layer 4. Also: non-default tabs, unopened modals, and anything a real assistive technology does. | Vitest + `axe-core` driven directly — no `jest-axe` | **Done.** `src/App.a11y.integration.test.tsx`, 30 tests |
| **6 — End-to-end** | Do whole flows work in a browser — signing in, blocking an account, moderating a comment, escalating a bug report, undoing a change — and do four of them work **with no mouse at all**? | Anything about the real backend. It has **never** run against one. | Playwright, Chromium, against MSW | **Done.** **15 specs, 233 tests** (2026-09-10). The figure counts the whole Playwright suite rather than this layer alone, which is how it has always been written and is worth saying: the six flow specs are 17 of it |
| **— Mutation testing** | Would the suite notice if the code were wrong? | — | Stryker | **Not built**, deliberately. See `docs/TODO.md` |

### What layer 3b does not reach, said plainly

**Detail views are not swept — and the gap moved on 2026-09-10 rather than closing.** The user
profile modal, the audit and activity detail panels, the bug-report modal and the catalogue edit
modals each need a second request and an interaction to open, and none of them is exercised by
the degraded-payload layer. It answers for **list reads only**, on seven screens.

`e2e/surfaces.spec.ts` now opens all eleven of them in a browser, so they are no longer
unmeasured — it found five findings on its first run. But it measures **layout, naming, focus
and contrast**, not payloads. *A missing field inside a detail view is still caught by nothing
in this suite*, and that sentence is unchanged on purpose. The two layers reach the same modals
and ask different questions of them.

Two smaller limits belong with it. The catalogue's Professors and Ratings tables sit behind tabs
the layer does not open, so `F-032` was found on two of the four tables that have it and read off
the code for the other two. And `author` and `actor` are excluded from the sweep by name, because
`F-022` already records what they do.

## 3b. What each layer scanned and found nothing in

A layer that finds nothing has still measured something, and the measurement is worth as much as
a defect — but only if its **scope** is stated with it. A clean result whose scope is unstated
claims everything.

| Layer | Candidates scanned | Result |
| --- | --- | --- |
| **1 — Call surface** | **108 methods** discovered across `src/api/**`, covering all **44 endpoints**. 87 exercised by 49 calls; 21 are the four transport classes, exempt with a written reason each. The activity log added two endpoints and no new class: it is the same reader and meta service pointed at a second `LogResource`. | **Clean.** Every endpoint sends the path, verb, `Authorization`, `Content-Type` presence, body and query string that `consumer-contract.md` describes. No finding. |
| **3a — Resilience, service** | **44 endpoints x 13 failing answers = 572 cases.** | **Clean.** Every one raises the right `ApiError` subclass with the right `transient` and a non-empty message. The two findings from this layer came from the 42 **`204`** cases, which are counted separately. |
| **3b — Resilience, screen** | **7 screens**, field lists generated from the fixtures' own keys: 139 cases. | **The Dashboard is clean on every single case** — every field removed, every nested object nulled, every wrong type. Its code comments claim it defends against a missing counter and it does. List cardinality 0/1/3 clean on all five list screens; the loading state genuinely visible on all six. |
| **4 — Real browser, target size** | **103 controls** across eight routes, measured with `getBoundingClientRect`, none left undetermined. | Not clean — `F-037`. Recorded here because axe's own `target-size` rule **passed all eight routes** over the same controls: it grants exceptions for spacing and inline targets. Two tools, two answers. |
| **4 — Real browser, layout** | Nine routes at **800, 1024 and 1440px**; five tables; the longest content the columns can be handed; three alert-strip combinations; and eleven dialogs at the same three widths. | **Clean at 1440px** — no page scrolls sideways, and all four tables fit exactly (1134 = 1134). The strips push nothing off screen with one strip or with two. `F-036` is the 1024px result. |
| **4 — Real browser, fields** | The **five** multi-line boxes in the panel at 1024 and 1440, each measured holding its own fixture value and then the 264-character `long-content` string: rows shown against the `minRows` declared, and pixels of content hidden. | **Not clean — `F-084`, and nothing had ever looked.** Every box was 2.5 rows whatever it asked for, and the comment editor hid 27 of 191 characters. Now clean at both widths: the floors apply, nothing is hidden, and a 1500-character value stops at the twelve-row ceiling and scrolls inside itself rather than growing the dialog or the page. |
| **4 — Real browser, focus** | Modal trap, Escape, focus return, and Enter on a control inside a clickable row — on **one** modal until 2026-09-10, on **eleven** since. | **Clean on the one, and not on the eleven.** The trap holds everywhere and no dialog carries a positive `tabindex`. Escape returning focus to the opener held for the modal it was written against and **failed on three confirmations**, which unmount before Mantine can restore — fixed in `ConfirmModal`. `F-042` is the lecture editor, where Escape stops closing the dialog at all. A clean result on one instance of a component said nothing about the other ten. |
| **6 — Keyboard, end to end** | Signing in, blocking a user, hiding a comment and undoing an audit entry, driven with **no `click()` anywhere in the file**. | **Clean, and this is the round's most useful negative result — with its scope: four flows, one browser, 1440px.** It also measured the distances: 16 tab presses to a comment's edit control, 24 to a revertible audit entry, and the sign-in screen has exactly **one** tab stop until an address is typed, because its button is `disabled` until then. |
| **5 — Accessibility** | Nine routes, every axe rule that runs in jsdom; every focusable control; every row control on Comments; every rendered badge. | **Six of the eight routes clean.** Every focusable control on all eight takes focus; every row control on Comments is reachable; **no badge anywhere carries its meaning in colour alone.** |
| **6 — End-to-end, network** | Every response on all nine routes whose path starts with `/api/`, read through `Response.fromServiceWorker()`. | **Clean — nothing reaches the network.** This was **not** true before this round: the browser worker had no catalogue slice, so `/data/lectures`, `/data/professor` and `/ratings` went through the Vite proxy to the deployed backend, from a suite whose premise is that it contacts nothing. Nobody noticed because no spec opened the catalogue. |


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

Coverage as of 2026-09-10: **93.09% statements / 86.61% branches / 91.56% functions
/ 94.76% lines.** Per-directory figures are in
[testfindings.md](testfindings.md#coverage), generated from
`coverage/coverage-summary.json` rather than transcribed. Per section 0, that report
is the authority and every number in this document is a dated snapshot of it.

### 6.1 API service layer — 14 files, 759 tests

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
| `client/bodylessWrites` | 11 |
| `callSurface` — the layer 1 sweep and its ratchet | 58 |
| `responseShapes` — the layer 3a matrix | 617 |

`ApiClient` carries the cross-cutting rules: the bearer token, `401` ending the
session, and an unreachable backend *not* ending it. `AuthService` covers `/auth/me`
in both the `username`/`kitEmail` and the older `name`/`email` spelling, and an
absent `isSuperAdmin` becoming `false`.

`bodylessWrites` is the odd one out and belongs here rather than with the pages: it
runs on MSW, not on a stubbed `fetch`, because the thing it asserts — that five writes
send **no `Content-Type`** — only exists once a real request has been built (`F-023`).
It is also the only test in the project that has been **verified as a tripwire**: the
client was deliberately changed to set the header always, six of its assertions went
red, and the change was reverted. A test pinning correct behaviour has no defect to
fail against, so it is worth nothing until it has been shown to fail.

### 6.2 Feature pages — 10 files, 244 tests

| Page | Tests | Notable coverage |
| --- | --- | --- |
| `users/UsersPage` | 25 | Search, filters, cursor paging, the profile modal, warn / block / unblock / delete, and the elevated-operator permission — including that an ordinary admin sees an admin's status locked but the credibility score editable |
| `comments/CommentsPage` | 19 | Reported content, thread expansion, moderation actions across both tabs |
| `catalog/CatalogPage` | 16 | Lecture and professor editing, the warning before a record is switched inactive, a refused save keeping the editor open with what was typed |
| `feedback/FeedbackPage` | 13 | Bug reports, the History tab, the GitLab control when `gitlabEnabled` is false, a refused deletion |
| `logs/AuditLogsPage` | 12 | The one screen that filters and pages **server-side**, so every assertion is about the query string that went out |
| `logs/ActivityLogsPage` | 7 | Only what differs from its sibling: the actor-type filter, the metadata summary, and that **no undo control exists anywhere on it** |
| `degradedPayloads` — the layer 3b matrix, over seven screens | 139 (3 skipped) | Every read field removed one at a time, nested objects nulled, scalars given the wrong type, lists of 0/1/3, and a slow read — asserting the screen still shows something rather than the boundary's fallback |
| `dashboard/DashboardPage` | 6 | Stat cards, a partial read keeping the half that arrived, `counts: null` not read as zeros |
| `auth/LoginPage` | 6 | The two-step flow; an address outside the team never reaches `request-login` |
| `help/HelpPage` | 1 | Sections start collapsed and open on click |

### 6.3 Shell, state and shared code — 25 files, 195 tests

| Area | Files | Tests | Coverage |
| --- | --- | --- | --- |
| `src/App.integration.test.tsx` | 1 | 20 |
| `src/App.a11y.integration.test.tsx` — the layer 5 scan | 1 | 30 | axe over all nine routes, focus reachability, keyboard reach to row actions, badge text, and the login field's label and error association |
| `src/context` | 1 | 16 | Session restore, a stored session carrying `isSuperAdmin`, rejection of a malformed one, withdrawal of an elevation `/auth/me` no longer reports, and a check that fails without being refused being reported rather than swallowed (`F-013`) |
| `src/theme` | 1 | 8 | That inputs and modals are painted by the theme with no `styles` prop, and that a component-level override lands on top of it |
| `src/features/*/model` | 6 | 32 | `feedback` (8), `catalog/edit` (6), `moderation` (6), `users/userEdit` (5), `catalog/catalog` (4), `catalog/deletion` (3) |
| `src/layouts` | 1 | 4 | The shell's unconfirmed-session notice, that it is announced politely rather than assertively, and that dismissing it returns focus to the main landmark instead of `document.body` |
| `src/features/auth` | 2 | 12 | `authenticateAdmin` (10), `loginModel` (2) — including one discriminated message per way the identity read can fail (`F-014`) |
| `src/features/dashboard/hooks` | 1 | 4 | `useDashboardData` |
| `src/utils` | 6 | 34 | `keyboard` (11), `assert` (9), `formatDate` (5), `getErrorMessage` (5), `color` (3), `adminAccess` (1) |
| `src/domain` | 2 | 7 | `auditLog` (5), `moderation` (2) |
| `src/components` | 2 | 12 | `ErrorBoundary` over `react-error-boundary` (5), `ClickableRow`'s activation contract (7) |
| `src/api/client` | 1 | 16 | The eleven-class error hierarchy and `transient` (ADR 0013) |

### 6.4 Known automation gaps

Stated so the matrix above is not mistaken for full coverage.

- **Eight files touch HTTP; five still replace their service.** Section 2 names both
  lists. **The catalogue hole is half closed:** `src/test/msw/handlers/catalog.ts` now
  exists, so the catalogue's eight endpoints are exercised by the call-surface sweep and
  its screen is driven over real requests by the degraded-payload layer — but
  `CatalogPage.integration.test.tsx` itself still replaces its service module, so the
  feature's own tests still assert a mock.
- **`src/layouts` has four tests, and had none until this round.** They cover the
  shell's own notice; the sidebar and the navigation are still exercised only
  indirectly, through the routing tests.
- **`src/components`** — two tested files out of fifteen. The rest are presentational
  and covered indirectly by the page tests.
- **`src/features/moderation`** — its `model/` is covered; its components and hooks
  are reached only through the comments page.
- **Accessibility is measured now, and the gap has moved rather than closed.** axe runs
  over all eight routes in jsdom and over two rules in Chromium, and the keyboard and
  focus paths have tests. What is **still** unmeasured is named rather than implied:
  `color-contrast` can be decided for only **46 of 407 nodes** because axe cannot resolve
  a gradient background (`F-035`); non-default tabs, unopened modals and unexpanded rows
  are never scanned; and nothing anywhere establishes what a real assistive technology
  does with this markup — no screen reader has been near it.
- **Nothing is *measured* below 800px, and that is now a measurement rather than an
  omission.** `e2e/layout.spec.ts` compares the navbar with the viewport at seven widths
  and records that at 320, 480, 640 **and 768** the navbar *is* the viewport — the panel
  is not on screen to measure. 800 is the first usable width. So the layout figures are
  taken at 1024 and 1440, and everything narrower is recorded as **not measured, which is
  not the same as passed**. `F-019` is unchanged and still open.
- **The end-to-end layer proves nothing about the real backend.** It runs on MSW, in
  Chromium, at desktop widths. Section 7 states this at length because it is the claim
  most easily over-read.
- **Eight defects are pinned as they are rather than fixed** — `F-022` (a null actor or
  author takes the table down), the swallowed `415` on sign-out, and the six this round
  added and left: `F-026`, `F-028`, `F-029`, `F-031`, `F-032`, `F-034`, `F-037`. `F-030` was
  pinned the same way and is now fixed, so its pin asserts the fix instead. Those tests assert the
  **current** behaviour, so a green suite is not evidence any of it is acceptable. Every
  one of them is pinned in a way that goes red in *both* directions — a new defect of the
  same shape, and a fix — so none can be quietly resolved or quietly widened. All are in
  [TODO.md](TODO.md) under *Known, measured, deliberately deferred*.
- **Detail views are not swept for degraded payloads.** Section 3a says this at length;
  it is repeated here because it is the round's largest stated gap.
- **`src/constants`** — no tests, and none would be useful: the files are literals.

## 7. Manual and end-to-end scenarios

The right-hand column names the spec that covers each scenario, so the manual list
and the automated one cannot drift apart. A row still reading `—` needs a person: a
real backend, a deployment, or a decision.

### What the end-to-end layer does not establish

Stated first and plainly, because it is the claim most easily over-read.

**It has never run against the real backend. Not once.** `VITE_MOCK_BACKEND=true`
serves the panel from the same MSW handlers the integration tests use. **A flow
passing here is not evidence it passes against the deployed backend** — it is
evidence the panel behaves correctly against *this repository's description of* the
backend. Where that description is wrong, both sides are wrong together and the suite
is green. `F-002` was exactly that shape, one layer down.

**It runs in Chromium only.** One project is configured in `playwright.config.ts`,
deliberately: the panel is an internal desktop tool, and a cross-browser matrix would
buy coverage of a problem nobody has reported at the cost of a suite nobody runs.
Nothing is known about Firefox or Safari, and nothing should be claimed.

**It runs at desktop widths only.** The measuring specs set 800, 1024 and 1440
explicitly; the flow specs use the default `Desktop Chrome` viewport. The panel is in
fact unusable at and below 768px — the sidebar covers the whole screen (`F-019`) — and
that is **recorded as not measured rather than passed**: one test pins the dead zone at
320, 480, 640 and 768 and pins 800 as the first width at which there is a panel on
screen to measure at all.

**Since 2026-09-10 it also opens things.** Eleven modals and four forms
(`e2e/surfaces.spec.ts`), four flows driven with no mouse at all
(`e2e/keyboard.spec.ts`) and every `?fault=` state (`e2e/faults.spec.ts`). Two limits
belong with that. The modal registry is **hand-written** — whether a control opens a
dialog is only knowable by pressing it — so it is guarded the way the call-surface
ratchet is: every entry must really open a dialog with the name it claims, and every
route must either appear in it or be named as having none, with a reason. And the
keyboard specs establish **four flows, in one browser, at one width**; nothing is
claimed about the flows they do not walk.

Running against no backend is a decision, not an omission: these flows are also what
gets walked by hand at the Abnahme, and pinning them to a deployment would make them
fail for reasons that have nothing to do with the panel at the one moment they are
being demonstrated. The rows below that still say `—` are the ones that need a real
backend, and **none of them has been run**.

| ID | Scenario | Expected | Automated by |
| --- | --- | --- | --- |
| E2E-1 | **Elevated operator.** Sign in as `unzhz@student.kit.edu`; warn, block, unblock and delete a real admin account; edit its status and credibility score. | Every action succeeds and the audit log records it with the right actor. | — (needs a real backend) |
| E2E-2 | **Ordinary admin against an admin target.** Repeat E2E-1 as a non-elevated admin. | Refused with `409`; status locked in the edit form, credibility score still editable. | **Partly** — `e2e/blocking-a-user.spec.ts` asserts the panel surfaces a `409` with the backend's own sentence and changes nothing, via `?fault=block-refused`. Whether the backend *sends* that `409` still needs a real one. |
| E2E-3 | **Self protection.** Try to block, delete or demote your own account. | The controls are not offered, and the backend refuses the request if made directly. | **Partly** — `e2e/blocking-a-user.spec.ts` asserts the controls are not offered while Edit stays. The backend's own refusal still needs a real one. |
| E2E-4 | **Session survives a reload.** Sign in, reload the tab. | Still signed in; sidebar shows the real account name, not `Unknown account`. Regression guard for `F-002`. | `e2e/signing-in.spec.ts` |
| E2E-5 | **Login code round trip.** Request a code with an allowed KIT address, then with one outside the list. | A code arrives for the first; the second is refused with "You do not have access to this panel" and no code is sent. | `e2e/signing-in.spec.ts` — and the refusal is asserted as *no request*, not as an unused double |
| E2E-6 | **Expired or revoked token.** Let the session be revoked, then act. | A `401` ends the session, the login screen says it expired, and the visited path travels in `state.from`. | `src/App.integration.test.tsx`, on MSW |
| E2E-7 | **Backend unreachable.** Stop the backend, reload. | The session is **not** ended; the panel reports the failure instead of signing the admin out. | `src/App.integration.test.tsx`, on MSW — a real transport failure, not a rejected double |
| E2E-8 | **Catalogue inactive toggle.** Switch a lecture or professor off. | The warning appears before saving, and the record then disappears from the list. See `G1` in [backend-tasks.md](backend-tasks.md). | — |
| E2E-9 | **GitLab issue creation** with `gitlabEnabled: false`. | The control is hidden rather than offered and failing with `503`. | `e2e/triaging-a-bug-report.spec.ts` (enabled path) and `e2e/escalating-a-bug-report.spec.ts` — the control is withheld **and no request reaches the endpoint**, which is the contract claim rather than the appearance of it; plus the issue persisting across a re-read |
| E2E-10 | **Production build under `/admin/`.** Build and serve the image. | Assets resolve under the base path; deep links and reloads work. See [deployment.md](deployment.md). | — |
| E2E-11 | **Comment moderation.** Set a report to `ACTION_TAKEN`; then to any other status. | The content is hidden, then restored. | `src/features/comments/CommentsPage.integration.test.tsx` (both halves) and `e2e/moderating-a-comment.spec.ts` |
| E2E-12 | **Bug report status update.** Change a report's status and severity. | The report moves to History and the change survives a reload. | `e2e/triaging-a-bug-report.spec.ts` |
| E2E-13 | **Revert a field edit from the audit log.** | The fields go back, the log is re-read, and the reversal's own entry appears. A non-revertible entry explains why. | `e2e/undoing-a-change.spec.ts` |

**Eight of the thirteen are automated now, two are half automated, and three are not.**

- **Automated:** E2E-4, E2E-5, E2E-6, E2E-7, E2E-9, E2E-11, E2E-12, E2E-13. E2E-9 is the
  one that moved this round — the unconfigured GitLab path is asserted as a *withheld
  control and no request*, which is the contract claim rather than the appearance of it.
- **Half automated:** E2E-2 and E2E-3. The panel's own behaviour is asserted — the
  controls it withholds, and that a `409` reaches the screen carrying the backend's
  sentence. Whether the backend *sends* that `409` is the other half and cannot be asked
  of MSW. Recorded as half rather than promoted to full, because the scenario as written
  is about the backend's refusal.
- **Not automated:** E2E-1 and E2E-8 need a real backend; E2E-10 needs a built image.

Those five rows are the manual list, and they are the reason section 7 still exists.

## 8. Entry and exit criteria

**Entry:** the branch builds and `npm run check` is clean.

**Exit for a merge:** `npm run check`, `npm test` and `npm run build` pass, coverage
has not fallen, and any scenario in section 7 that the change touches has been run
and recorded.

**`npm run test:e2e` is a local gate, not a CI one.** The `web:e2e` job is
`when: manual` and `allow_failure: true`, so it runs only when somebody starts it. That
is a decision about time rather than about trust: the job cannot share the Alpine image
the rest of the pipeline uses, so it pays for a large browser image and its own
`npm ci` before the first test runs, on every push, for a suite whose value is
occasional. **Run it locally before merging anything that touches a flow in section 7**
— nothing in CI will tell you it broke.

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

## 11. Release-readiness audit — 2026-09-10

A one-off pass before the hand-in, run as **measure first, then fix only what carries no
visual risk**. Everything it found is in [testfindings.md](testfindings.md) as `F-043`…`F-060`;
everything it deliberately left is in [TODO.md](TODO.md) with an estimate. This section
records what was in scope and — the part worth writing down — what was not, and why.

### What it measured

| # | Question | Answer, in one line |
| --- | --- | --- |
| A1 | Does the bundle leak anything, and what does it cost? | **No secrets.** Zero JWTs, zero key-shaped assignments, no backend host baked in. The six admin addresses are there and are [ADR 0010](adr/0010-admin-email-list-in-the-bundle.md)'s accepted case, verified rather than assumed; the seventh hit was the email field's *placeholder*. **Source maps are not published** — Vite's default, confirmed on a clean build. First load ~220 KB gzipped; all 10 screens are code-split per [ADR 0007](adr/0007-route-based-lazy-loading.md). Three dead or dev-only files ship (`F-053`). |
| A2 | What does the document head say? | `<title>` and `lang` were already right — checked, because a starter default is the usual finding. Description, robots and a tab-sized favicon were missing (`F-043`, fixed). |
| A3 | Do images and icons carry names? | The panel's **only** `<img>` has `alt` and explicit dimensions; all 14 icon-only `ActionIcon`s have `aria-label`. Two real gaps (`F-044`, `F-045`, both fixed) and one systemic one (`F-051`). |
| A4 | What happens on a path that does not exist? | **No broken internal link** — the route table was *generated* from `constants/routes.ts` and cross-checked against every navigation target: 9 declared, 9 mounted, 15 targets, no orphans either way. Unknown paths redirect to the dashboard silently (`F-046`); the panel emits no anchors at all (`F-048`). |
| A5 | Do the forms mark, tie and lock? | Submit locking is sound everywhere. **No form has field-level validation**, so no field is tied to its message (`F-049`); `F-031` is fixed for sign-in only. Four modals are dismissible mid-save (`F-050`). |
| A6 | Is transport safe? | Reported, not changed. Three headers exist but not on `assets/`; no CSP, no HSTS; HTTPS **unverifiable from this repository** (`F-052`). |
| A7 | Does the panel obey its own design rules? | Zero emoji, zero `hsl()`/`rgb()`, zero Mantine `shadow=` props. Violations in six categories: `F-055`…`F-060`. Listed, none fixed. |

### What was excluded, and why

The panel is an **internal tool behind a login wall**, not a public marketing site. The
following were considered and ruled out of scope by that fact, rather than skipped:

- **Privacy policy, terms of service, cookie banner.** The panel sets no cookie for
  tracking, has no public visitors and collects nothing from anyone who is not already a
  named operator with a KIT account. The consent surface these documents exist for does
  not exist here. Any obligation that does apply attaches to the *student app* and its
  backend, not to this console.
- **Sitemap, social preview image, Open Graph and Twitter cards.** These exist to make a
  page findable and attractive when shared. This panel is the opposite case: `F-043` added
  a `noindex` and a `Disallow: /` precisely so that it is *not* found.
- **Analytics.** Adding a third-party script to an admin console means sending operator
  behaviour off-site. That is a decision with a privacy cost and no measurement need — the
  audit trail already records what operators do, and it stays on the backend.
- **Marketing CTA, pricing, testimonials.** [DESIGN.md](DESIGN.md) already bans
  "marketing furniture generally" and "fabricated statistics, testimonials or activity".
  Nothing here would have a customer to convert.
- **`robots.txt` — the one exception.** An indexing block *was* wanted and was added. Note
  `F-047`: under the `/admin/` base path it is served where no crawler reads it, which
  leaves the meta tag doing the real work.
- **A 404 screen.** Not a scope exclusion — a deferral. `F-046` records the behaviour and
  TODO.md prices it at ~2 h. A new screen needs the pass DESIGN.md asks for, and this
  round changed nothing visual on purpose.

### What this audit is not

It is a **read of the repository plus a clean build**. It did not run against the deployed
host, so nothing here establishes that HTTPS is enforced, that HSTS is set, or what the
host-level proxy in front of nginx does — that proxy is not in this repository, and
`F-052` says so rather than implying coverage. It also did not open a modal or a non-default
tab while scanning, which is layer 5's standing limit and is how `F-044` survived until a
component test looked at it directly.
