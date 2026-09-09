# Test Findings

Results and defects from executing `docs/testplan.md`. One row per finding, with
the newest first. A finding is closed only when the fix is described in
`CHANGELOG.md` and the scenario has been re-run.

**Severity** — *Blocker*: the panel cannot be used or a permission is wrong.
*Major*: a feature is broken or misleading. *Minor*: cosmetic or an edge case.

## Open

| ID | Date | Area | Scenario | Severity | Finding |
| --- | --- | --- | --- | --- | --- |
| F-037 | 2026-09-09 | All screens / touch targets | Layer 4 | Major | **Touch targets under 24x24, everywhere except the one control `A2` measured.** `A2` measured `ErrorAlert`'s dismiss button, found 20x20, raised it to 24x24 and wrote the WCAG 2.2 SC 2.5.8 rule in a comment above it. The rule was applied to nothing else. Measured in Chromium at 1440px with `getBoundingClientRect`, on every visible `<button>` on all eight routes: `Sign out` is **61x21** and lives in the sidebar, so it is on all seven signed-in routes; the dashboard's `See everyone →` is **90x17**; and **every row action on Comments is 22x22** — the expand toggle and the edit and delete icons, on every row, which are the panel's actual moderation controls. **axe's `target-size` passes all eight routes**, and that is not a contradiction: axe grants exceptions for spacing and for inline targets, so it permits boxes this measurement reports. Two tools, two answers, and the blunter one found it. Not fixed: three sizes to raise, each of which moves a row's height, so it wants the same visual pass `F-012` and `F-036` are already waiting for. |
| F-036 | 2026-09-09 | All tables / responsive | Layer 4 | Minor | **Every table needs horizontal scrolling below roughly 1300px.** Measured in Chromium, not reasoned about. At **1440px all four tables fit exactly** — they need 1134px and get 1134px. At **1024px all four overflow**: Comments needs 1100 and gets 718 (**+382**), Lectures & Professors +282, Audit Logs +182, Users +162. The holder width is the viewport minus 306 (a 240px navbar and 66px of gutters), so Comments needs roughly a **1406px** viewport before it stops scrolling sideways. Nothing is unreachable — every holder scrolls — so this is a cost rather than a defect: the operator scrolls sideways on every table at 1024px, and `F-012`, the REASON column clipped to five characters, lives in the worst of them. Not fixed: a column-width pass over four tables at three widths, which is the pass `F-012` is already waiting for. |
| F-035 | 2026-09-09 | Theme / testability | Layer 4 | Minor | **89% of the panel's colour contrast cannot be measured automatically.** A finding about the evidence rather than about the pixels. Running axe's `color-contrast` in Chromium over the eight routes reaches 407 nodes and can decide only **46** of them: 1 fails, 45 pass, and **361 are returned `incomplete`** with the reason `Element's background color could not be determined due to a background gradient`. `src/interactive.css` paints the panel's surfaces with `linear-gradient(180deg, #171b23 0%, #14171e 100%)`, and axe cannot compute a ratio against a gradient. Help is the extreme: **0 determined, 28 undetermined**. The consequence is that no automated check can ever confirm contrast on most of this panel, so the honest claim is "46 nodes measured, 1 failed" and never "contrast is fine" — which is what a report quoting a green run would have said. Not fixed: either a flat token behind text, which is a theme change, or manual sampling at delivery, which is hours and does not stay true. |
| F-034 | 2026-09-09 | Dashboard / theme | Layer 4 | Major | **A colour-contrast failure on the dashboard, measured at 3.56:1.** The subtitle "Head straight to any section." is `chrome.textDim` (`#6b7280`) on the panel gradient (`#171b23`) at 12px. WCAG AA asks 4.5:1 for text that size. One element fails as the eight routes first render — but `chrome.textDim` is used **60 times across 37 files, 30 of them at `size="xs"`**, so what was measured is one element and what is at risk is far wider; the rest sits on backgrounds axe could not resolve (`F-035`). Not fixed, and not a code change: it is a design-token change, so [DESIGN.md](DESIGN.md) §Method applies. |
| F-033 | 2026-09-09 | Test suite / end-to-end | Automated suite | Minor | **One flaky end-to-end run, not reproduced.** The first `npm run test:e2e` of the session reported `1 failed | 10 passed`, in `e2e/moderating-a-comment.spec.ts:33` — "correcting a comment shows the text the backend now holds". Three consecutive runs immediately afterwards were green, as was every run since, including the full suite at 68 tests. The test was identified; the failure detail was not captured, only the summary line. Recorded for the same reason as `F-024` and kept separate from it because it is a different suite in a different runtime: a suite that fails once in four is not a green suite. Deferred: cost unknown until it reproduces. |
| F-032 | 2026-09-09 | All tables / accessibility | Layer 5 | Minor | **The actions column has an empty header, in four tables.** `ContentTable`, `LecturesTable`, `ProfessorsTable` and `RatingsTable` each end their `TABLE_COLUMNS` list with `''`, so `TableHeaderRow` renders `<th scope="col"></th>` and a screen reader announces nothing for that column. axe reports `empty-table-header`. Two of the four were found by the route scan; the other two sit behind catalogue tabs it does not open and were found by reading, which is the scan's stated limit rather than a gap in the finding. Not a one-line fix: the panel has **no visually-hidden utility**, so naming the column means adding one or showing a word the design does not have. |
| F-031 | 2026-09-09 | Sign-in / accessibility | Layer 5 | Minor | **A refused sign-in address is not tied to the field it refuses.** Measured: after submitting an address `adminAccess` rejects, the email input carries no `aria-invalid` and no `aria-describedby` reaching the message. The sentence is rendered in the page-level `ErrorAlert` above the form, so it is announced once when the alert appears; a screen-reader user who then tabs back to the input hears nothing about why it was rejected. The visible layout is correct and this is invisible to a sighted operator, which is why it needed a test rather than a look. |
| F-030 | 2026-09-09 | Dashboard / accessibility | Layer 5 | Major | **Two progress bars with no accessible name.** `SystemPulse.tsx:39` renders `<Progress value={…}/>` for each of its two metrics with the label in a *sibling* `<Text>`, so a sighted operator reads "Active accounts 62%" while a screen reader reads an unnamed progressbar twice. axe reports `aria-progressbar-name` at `serious`. The fix is `aria-label={metric.label}` — one line, one file, no visual effect — and it is recorded rather than made, because this round changes no production code. |
| F-029 | 2026-09-09 | Moderation and catalogue | Layer 3 | Major | **Two unguarded `.length` reads on fields declared non-optional.** `ContentCell.tsx:28` reads `item.content.length` to decide whether the text needs a tooltip, and `LectureTableRow.tsx:56` reads `lecture.professors.length` to decide between "Unassigned" and the list. A payload without either field throws during render and the whole screen goes to `AdminRoutes`' boundary. Measured by removing each field from the wire, one at a time, and rendering. Same family as `F-022`, and it should ride along with that change rather than be done alone. |
| F-028 | 2026-09-09 | All screens / contract | Layer 3 | Major | **An enum value the panel does not know takes the whole screen down.** 14 cases across five screens, through **three unguarded mechanisms with one cause**: `enumLabel(value)` calls `value.split('_')` (10 cases — users `role` and `status`, comments `status`, lectures `lectureType`, bug reports `severity`); `auditActionColor(log.action)` calls `action.endsWith(…)` at `AuditLogRow.tsx:48` (2 cases); and `reportStatusIcon[report.status]` at `ReportQueueItem.tsx:38` is used as a JSX element type, so an unknown key yields `undefined` and React raises "Element type is invalid" (2 cases). The three were told apart by guarding `enumLabel` and watching only 10 of the 14 turn green. **Not hypothetical:** `docs/consumer-findings.md` C-10 already records that the compiled-in audit action list is **three values behind** the backend — mechanism 2 is that gap with a crash on it. What the operator sees is not a blank page: the boundary catches it, so the sidebar and sign-out survive, but the screen is replaced by "This page could not be displayed." and *Try again* re-renders the same payload and fails again. |
| F-027 | 2026-09-09 | API client | Layer 3 | Minor | **There is no request timeout anywhere.** `ApiClient.fetchResponse` calls `fetch` with no `AbortSignal`, `fetch` has no default, and TanStack Query adds none. Measured rather than read off the source: a handler that never answers leaves the promise pending and nothing settles it. On screen that is `PageLoader` for as long as the tab is open, with no way for the operator to tell a hung backend from a slow one. Like `F-013`'s silence, this was not decided — it is the absence of a decision. |
| F-026 | 2026-09-09 | API client / contract | Layer 3 | Minor | **A `204 No Content` throws a `TypeError` in four services.** `ApiResponseParser` returns `undefined` for a 204, and four services then read a property straight off it: `TokenLoginService.login` reads `response.authToken`, `AuthSessionService.me` reads `response.user`, `UserAccountsService.getById` hands the body to `withRequiredAdminRole` which reads `subject.email`, and `SystemStatusService.getStatus` hands it to `toSystemStatus` which reads `response.status`. The asymmetry is the sharpest part: `UserAccountsService.list`, three methods above `getById` in the same class, goes through `expectArray`, which guards with `?.[key]` and raises a `ContractError` — same file, same question, two different answers. Measured by asking all 42 endpoints; the other 38 either accept an empty answer or raise an `ApiError`. Severity Minor because the backend envelopes every endpoint, so a 204 is a recorded risk rather than a live defect — the same standing as `F-022`. |
| F-024 | 2026-09-09 | Test suite | Automated suite | Minor | **One flaky run — the test is identified now, the cause is not.** Originally recorded as `1 failed | 165 passed` on `npx vitest run .integration.test.` with the failing test never identified. It reproduced during this round's Layer 1 work and **the test has a name**: `src/App.integration.test.tsx:109`, *renders protected content when auth is restored from storage*, timing out at line 116 on `findByText("A quick look at how your community's doing today.")` — the dashboard never finishes rendering inside the default one-second wait. **It is not caused by this round's changes**, and that was measured rather than assumed: with the new MSW catalogue slice and the new test files moved out of the tree, ten full-suite runs produced **one failure in ten**; with them in place, two in seven. The rate is the same and it is load-dependent — the file alone is 25/25 green unloaded and 8/8 green under CPU saturation, so what reproduces it is the full suite's own parallelism rather than machine load. Still deferred, and still for the original reason: the cause is unidentified, so the cost is unknown. The most likely candidates are unchanged — the module-level state the MSW handlers hold for the session and the store, reset per test but per *file* in load order. `F-033` is the same shape in the end-to-end suite. |
| F-022 | 2026-09-09 | Audit log and moderation / contract | E2E-5 | Major | **An `actor: null` takes down every row of the audit table, and an `author: null` every row of the moderation table — measured, deliberately not fixed.** `AuditEntry.actor` is declared non-null and read without a guard in four places, while `target` — nested identically, in the same interface — is `AuditTarget | null` and guarded at both of its. `ModeratedItem.author` is the same shape, while `ratingMapper` and `userWarningMapper` both defend theirs. That asymmetry is the most concrete thing in `docs/consumer-findings.md` (C-07). Two tests now record what actually happens: the row never arrives, because `AuditLogRow` and `ContentRow` read the name into their accessible label and throw before anything is painted — this is not a missing cell. **The backend has since confirmed the actor columns are five `NOT NULL`s, so this is a recorded risk rather than a live defect.** Not fixed because the fix is a nullable domain type whose `tsc` consequences reach every read site, which is not a last-day change. Deferred in [TODO.md](TODO.md) under *Known, measured, deliberately deferred*. |
| F-019 | 2026-09-09 | Shell / responsive | E2E-6 | Major | **Below the `sm` breakpoint the sidebar covers the entire viewport and the panel cannot be used at all.** `AdminLayout`'s `AppShell` declares `navbar={{ width: 240, breakpoint: 'sm' }}` with no `collapsed` configuration and no burger control, so below 768px Mantine gives the navbar the full width and there is nothing to close it with. At 320px and at 768px the screenshot is the sidebar and nothing else — no page header, no table, no way back. Found while photographing the session notice at the three widths `A2` was asked to check, which is the part worth recording: the notice was fine at both widths and could not be seen at either, because the panel is not there. Not fixed here — it is a decision about what the navigation becomes on a narrow screen, and [DESIGN.md](DESIGN.md) §Method applies. Distinct from the sign-in card overflow already fixed: that screen has no `AppShell`, which is why it was reachable at 320px and this is not. |
| F-020 | 2026-09-09 | Users / filters | E2E-2 | Minor | **A refused filter empties the users table instead of appearing above it.** `UsersPage` renders `page.tableError` under a comment reading "a refused filter is a `400` with a usable message — it belongs on screen, above the rows that are still the last good answer". It does not: `tableError` is gated on `hasLoaded`, which reads the current query's data, and applying a filter changes the query key — so there is no data, `hasLoaded` is false, and the screen falls through to the whole-page `LoadError` with the rows discarded. The prose states the intent and the code does the opposite, which is the same shape as `F-007` and `C-14`. Seen in Chromium with a `400` injected on a filtered read, not reasoned about. Not fixed here: keeping the last good page under a refusal is a loading-state change. |
| F-006 | 2026-09-09 | Catalogue / contract | E2E-8 | Minor | **`G1` is already answered by an endpoint the panel does not call.** `docs/backend-tasks.md` asks the backend for a way to read inactive catalogue records. The backend's own `docs/admin-api.md` documents `GET /admin/data/lectures/all` and `GET /admin/data/professor/all` as "Every lecture/professor, active or not" — they exist and are admin-only. The panel still reads `GET /data/lectures` and `GET /data/professor`, which filter on `active = true`, so switching a record off still removes it from the only list the panel can see. The gap is now a panel-side change, not a backend request, and it is **not** blocked behind `F-005`: both handlers are mapped to the legacy path as well — `@GetMapping({"/admin/data/lectures/all", "/data/lectures/all"})` — so the panel can call `/data/lectures/all` and `/data/professor/all` today, on the paths it already uses. The controller says it was written for exactly this: "a deactivated lecture or professor would otherwise be unreachable from the panel to correct or reactivate." Two lines in `LectureCatalogService` and `ProfessorCatalogService`, plus whatever the inactive warning and an All/Active/Inactive filter should then say. |
| F-005 | 2026-09-09 | API contract | — | Major | **The panel calls legacy paths the backend intends to remove.** The backend now serves every administrative route under an `/admin` prefix as well as its old path, and its `docs/admin-api.md` states the legacy paths "are removed once [the panel] has [moved]". The panel still sends `/users`, `/auth/me`, `/audit-logs`, `/reports`, `/ratings`, `/system/status` and `/data/lectures`. Nothing is broken today; the panel breaks entirely on the day the legacy routes are dropped. Confirmed in the backend's source, not only its prose: the controllers carry dual mappings, e.g. `@RequestMapping({"/admin/users", "/users"})`, so removing the legacy path is deleting the second array element. Found while establishing the contract artefact for `P1`, by reading rather than by a failing test — which is exactly the gap `P1` exists to close. Migrating is mechanical but is a behaviour change, so it is a decision for the maintainer, recorded in [TODO.md](TODO.md) under "Deliberately not done". |
| F-012 | 2026-09-09 | Moderation / reports table | E2E-11 | Minor | **The REASON column truncates every reason to five or six characters.** Seen for the first time in the browser, once the end-to-end layer made a signed-in moderation screen reachable: the badges render as `INSU…` and `OFF T…`, so the column that exists to say *why* something was reported says nothing. This is a different clipping from the report-reason **filter** fixed in the Entwurf pass — that one is now measured as fitting (`scrollWidth === clientWidth`, 218 = 218, with "Inappropriate Content" selected). This is the table column, which is sized as a share of a fixed layout in `ContentTable`'s `COLUMN_WIDTHS`. Not fixed here: changing a column's share moves every other column, which is a visual change and wants the pass [DESIGN.md](DESIGN.md) asks for. |
| F-011 | 2026-09-09 | Catalogue / ratings | E2E-9 | Minor | **The Ratings tab claims there are no ratings while it is still loading them.** `useRatings` computes a `loading` flag and `CatalogPage` never passes it to `RatingsTable`, which branches on the array alone — so the first read of `GET /ratings` shows a star icon and "No ratings here yet." for its whole duration. The dashboard's own code comments warn against exactly this ("zeros are indistinguishable from a real empty platform"); the rule was written on one screen and broken on another. The unused `loading` value would have prevented it had it been wired up. Not fixed in the Entwurf pass: it is a loading-state change and belongs with the `Skeleton` work in `P4`. |
| F-010 | 2026-09-09 | Feedback | E2E-11 | Minor | **A successful delete whose read-back fails warns into a modal that has already closed.** Feedback is the only screen with no page-level `ErrorAlert`; its errors are routed into `BugReportDetails` inside the modal. `deleteReport.onSuccess` calls `onDeleted()` — which closes the modal — before `readBack()`, so the "the change was saved, but reading it back failed" message is written to a slot nothing is rendering. The operator is left looking at a queue that still lists the deleted report with no indication anything is wrong. Not fixed in the Entwurf pass: adding a page-level alert region is `P4` work. |
| F-001 | 2026-09-08 | Users / permissions | E2E-1 | Blocker until verified | **The elevated operator has never been confirmed end to end against the deployed backend.** The backend reports `isSuperAdmin` on `/auth/me` and the panel reads it, but no one has yet signed in as `u-kisi4@student.kit.edu` and actually warned, blocked, unblocked and deleted a real admin account, edited its status and credibility score, and checked that the audit log names the right actor. Until that run happens the feature is implemented, not verified. Tracked as the Blocking item in `docs/TODO.md`. |

## Resolved

| ID | Date | Area | Scenario | Severity | Finding | Resolution |
| --- | --- | --- | --- | --- | --- | --- |
| F-021 | 2026-09-09 | Audit log | E2E-13 | Major | **An audit entry served without `changes` or `metadata` threw a `TypeError` and took down every row of the table.** Both are open maps the panel walks with `Object.keys` (`AuditLogRow`) and `Object.entries` (`AuditChangeList`, `MetadataList`), and `toAuditLog` filled in the three revert fields and stopped there — so `changes: undefined` reached `Object.keys` and threw. Not a detail-view problem: the **row** counts its own changed fields, so one such entry blanked the whole screen. An entry type that legitimately has neither — a sign-in, a deletion — is exactly what a serializer omits, which is why `docs/consumer-findings.md` C-08 asks the backend to always send both even when empty. Found by reading the client, pinned by a test that reproduced the exact `TypeError` before the fix. | Fixed in the `P0b` package. `toAuditLog` defaults both to `{}` — the same `?? {}` `ratingMapper` already uses for `scores`, rather than a new pattern — and `BackendAuditLog` now declares them optional, as `BackendWarning` does for `createdFrom`. An empty map and an absent key render identically, so nothing downstream tests for absence. Pinned by two tests in `AuditLogsPage.integration.test.tsx`. |
| F-023 | 2026-09-09 | API client / contract | — | Minor | **The five bodyless writes send no `Content-Type`, and nothing checked that they still do.** `ApiRequestBuilder` sets the header only when `init.body !== undefined`, and `JSON.stringify(undefined)` is `undefined`, so `POST /auth/logout`, `POST /audit-logs/{id}/revert`, `POST /reports/{id}/gitlab-issue`, `PATCH /users/{id}/block` and `PATCH /users/{id}/unblock` go out with the header **absent** rather than empty. Whether the backend accepts that was asked in `docs/consumer-findings.md` C-03 and §3.4 and the answer lived only in a paragraph — where nothing could contradict it, and where the backend's `500`-to-`415` change would have broken all five silently. | Pinned in the `P0b` package rather than fixed, because the behaviour is correct: the request recorder captures `Content-Type`, and ten tests assert the header is absent on all five and that a `415` on each surfaces the backend's own sentence instead of a crash. **Verified as a tripwire, not assumed**: making the client always set the header turns six of them red, and restoring it turns them green. |
| F-025 | 2026-09-09 | Test suite / CI | Automated suite | Major | **Thirty request assertions failed in CI and passed on every developer machine, because the pipeline's build variables reached the test job.** `.gitlab-ci.yml` declares `VITE_API_BASE_URL` globally — `web:build` bakes it into the bundle and `web:image` hands it to Kaniko — and a global variable is also set for `web:test`. Both `ApiClient` and `src/test/msw/apiUrl.ts` derive their base from that variable, so they stayed in agreement and **every assertion about the screen still passed**: the mock backend answered, the code step was reached, the error sentences appeared. Only the assertions about the *request* failed, because they name absolute paths — `requestsTo('POST', '/api/auth/login')` — and `/api` comes from the base. Under the deployed URL the same request was recorded as `/auth/login`, so the filter matched nothing. The signature was exact and is worth recording: **every assertion expecting a request failed, every assertion expecting *no* request passed**, and `bodylessWrites.integration.test.ts` — the one file that derives its expected path from `apiUrl` instead of typing it — was green throughout. The failure message said only `expected [] to have a length of 1`; nothing in it pointed at configuration. Locally the suite was green because the tracked `.env` sets `VITE_API_BASE_URL=/api`, which made that file quietly load-bearing for the tests. | Fixed by pinning the base for the test run: `test.env` in `vite.config.ts` sets `VITE_API_BASE_URL=/api`, which takes precedence over an inherited process variable, so the suite no longer depends on `.env` or on what the surrounding environment exports. **Verified by reproduction, not by reasoning**: exporting the CI value locally reproduced the same three failures in `LoginPage` and `AuthContext` by name before the change, and the full suite passes with that variable exported after it. The CI globals are left where they are — three jobs read them — with a comment saying why narrowing them is not what makes the suite green. |
| F-013 | 2026-09-09 | Authentication / session | E2E-4 | Major | **A session check that fails without being refused is completely silent.** `AuthContext` acts only on `UnauthorizedError`, so a `401` ends the session and every other failure of `GET /auth/me` — a `404`, a `403`, a payload the panel cannot read — leaves `checking` flipping to false with nothing recorded. The operator keeps working against the account copy captured at sign-in, which nothing has confirmed, and is told nothing. Keeping the session is deliberate and stays; the silence was not a decision, it was the absence of one. This matters now because the backend restored legacy `/auth/me` as an alias: the panel needs no change, and the way to know that is a test rather than a document — `docs/consumer-findings.md` C-01 records two documents in this repository contradicting each other on whether the path still exists. | Fixed across the `P0a` package. The provider carries `sessionCheckError`, and `AdminLayout` renders it as a dismissible warning strip inside the content gutters — the same `ErrorAlert` a page uses for its own errors, at a new `warning` level. Which failures are worth saying out loud is decided by `transient` rather than by a status, so a blip cannot drown the notice that matters. Pinned by four provider tests and four shell tests, including that focus returns to the main landmark rather than `document.body` when the notice is dismissed. Seen in Chromium at 1440px, alone and beside a page-level error. |
| F-015 | 2026-09-09 | Authentication / session | E2E-4 | Major | **A sign-in reported as failed left a live bearer token on the client.** The token has to be installed before `/auth/me` can be asked with it, so `authenticateAdmin` set it and only then resolved the identity. When that read failed the function threw, the login screen said the sign-in had failed — and `ApiClient` went on sending the token on every subsequent request. Found by reading the ordering while fixing `F-014`, not by a failing test. | Fixed in the `P0a` package. The identity read is wrapped, and a failure clears the token before rethrowing. Pinned by a test asserting `setToken` was last called with `null` after a failed read. |
| F-014 | 2026-09-09 | Authentication / session | E2E-4 | Major | **Four different sign-in failures collapsed into one sentence, and three of them were wrong.** `readSessionUser` wrapped `/auth/me` in a bare `catch` returning `null`, which `resolveAdminUser` turned into "Signed in, but your admin account could not be read. Try again in a moment." A `403` means the backend refuses this account the panel, and the account is readable; a `404` means the address the panel asks at is gone, and no number of retries will help; a `401` means the token minted seconds earlier is already refused, so waiting a moment is the one thing that cannot work. Worse, the bare `catch` discarded the **type** as well as the message, so `getLoginErrorMessage` — which already knows a `ForbiddenError` means "not authorized" — could no longer recover the right wording downstream. | Fixed in the `P0a` package. `readSessionUser` discriminates on the error type, not on a status: `ForbiddenError` is passed on untouched so the one function that owns that wording still decides it, `NotFoundError` and `UnauthorizedError` each get a sentence that is true, and everything else keeps the original message. This is ADR 0013's criterion met by a later change rather than by its own commit. Pinned by four tests in `authenticateAdmin.unit.test.ts`. |
| F-009 | 2026-09-09 | Catalogue / deletion | Automated suite | Major | **The delete dispatcher had no exhaustive check, and a fourth deletion kind would have deleted a rating.** `getCatalogDeletion` chose the confirmation wording with an exhaustive `switch` on `CatalogDeletion['type']`. `CatalogPage` then chose the *call* with a second dispatch over the same discriminant, written as two `if`s and a bare `return ratings.remove(...)`. Adding a fourth kind of deletion would have produced correct wording from the first dispatch and fallen through the second into deleting a rating. Found by reading, not by a test — nothing exercised a fourth kind, because there is not one yet. | Fixed in the Entwurf pass. `getCatalogDeletion` takes the three deleters and binds the call alongside the wording, so the two cannot disagree, and `assertNever` makes a fourth kind a compile error. Pinned by a dispatch test in `deletion.unit.test.ts` asserting each kind reaches its own deleter and no other. |
| F-008 | 2026-09-09 | All tables / keyboard | E2E-5 | Major | **Pressing Enter on a control inside a table row ran the row's action instead.** `activateOnEnterOrSpace` matched any Enter or Space that reached a clickable row, including keystrokes that had *bubbled* from a focusable descendant, and called `preventDefault()` before acting. A keyboard user who tabbed to a row's author chip and pressed Enter got the row's edit dialog: `preventDefault` suppressed the browser's synthetic click on the chip, so the chip's own handler never ran, and the row's did. The equivalent mouse path had been shielded with `stopPropagation` since it was written; the key path never was. Affected `ContentRow`, `LectureTableRow` and `ProfessorTableRow`, which have focusable descendants; `UserTableRow` and `AuditLogRow` were spared only because they have none. | Fixed in the Entwurf pass. The predicate is split out as `isOwnActivation` and tests `event.target === event.currentTarget`, so a bubbled keypress is left entirely alone — not acted on and not `preventDefault`ed, so the browser still turns it into a click on the control that is actually focused. Pinned by `keyboard.unit.test.ts` and `ClickableRow.unit.test.tsx`. |
| F-007 | 2026-09-09 | Help page | E2E-13 | Minor | **The Help page described a dashboard card that does not exist.** `help/content/dashboard.ts` documented a card called "Not blocked", coloured yellow for admin accounts. The dashboard renders "Active accounts" and uses `KIT.orange`. The Help page's colour tables were seven hand-written transcriptions of `constants/colors.ts` typed as bare `string`, so six agreed by luck and the seventh had drifted with nothing to catch it. | Fixed in the Entwurf pass. Every value row reads the real map, the card names are one constant read by both the grid and the Help content, and the refresh interval in the summary is computed from `REFRESH_INTERVAL_MS` rather than retyped. |
| F-004 | 2026-09-09 | Help page | Automated suite | Major | **The suite was red on `main`.** `HelpPage.integration.test.tsx` asserted a collapsed accordion section's text was `not.toBeInTheDocument()`. Mantine 9 keeps `Accordion.Panel` content mounted and hides it rather than unmounting it, so the text is present but invisible — the assertion described Mantine 8. Found while establishing a baseline for the refactor, not by a change. | Fixed in refactor step 0. The assertion is now `not.toBeVisible()`, which states what the test always meant: the sections start collapsed. Suite green at 37 files / 263 tests. |
| F-003 | 2026-09-05 | Users / edit form | E2E-2 | Major | **Credibility score was locked on admin accounts.** Only an admin's *status* is reserved for an elevated operator; a username, biography, credibility score or a demotion to `STUDENT` are accepted from any admin. The edit form applied one `accessLocked` flag to all of them, hiding fields from edits the backend would have taken. | Fixed in `bce01e6`. `UserEditForm` splits `accessLocked` into `statusLocked` and a plain `isSelf` check. Pinned by a test in `UsersPage.integration.test.tsx` that an ordinary admin sees an admin's status locked but the credibility score editable. |
| F-002 | 2026-09-05 | Authentication | E2E-4 | Blocker | **The panel signed the operator out on every reload.** `/auth/me` reports `username` / `kitEmail`, but `AuthUser` read `name` / `email`. Both were `undefined`, so `isAuthUser` rejected the stored session on the next load, the sidebar fell back to `Unknown account`, and the elevated permission was computed from an empty address — it had never reached the UI at all. | Fixed in `451bfb2`. `me()` reads either spelling and maps the payload onto `AuthUser`. Pinned by `AuthService.unit.test.ts` (both spellings, absent flag becomes `false`) and `AuthContext.unit.test.tsx`. |

## Where this round's findings came from

Which layer turned each one up, because that is the part worth knowing when deciding what to
build next. The layers are described in [testplan.md](testplan.md) §3a.

| Found by | How many | Which |
|---|---|---|
| **Layer 1 — the call-surface sweep** (42 endpoints, what the panel sent) | 0 | — see [What each layer scanned and found nothing in](testplan.md#3b-what-each-layer-scanned-and-found-nothing-in) |
| **Layer 2 — contract** (generated schema vs. responses) | — | **Not built.** `docs/api/openapi.json` is not in this repository; see [ADR 0008](adr/0008-generated-schema-is-the-contract-authority.md) |
| **Layer 3a — resilience, at the service layer** (42 endpoints x 14 answers) | 2 | F-026, F-027 |
| **Layer 3b — resilience, at the screen layer** (6 screens, fields removed one at a time) | 2 | F-028, F-029 |
| **Layer 4 — the real browser** (Chromium: layout, focus, contrast, target size) | 4 | F-034, F-035, F-036, F-037 |
| **Layer 5 — accessibility in jsdom** (axe over eight routes) | 3 | F-030, F-031, F-032 |
| **Layer 6 — end-to-end** (two new flows) | 0 | the escape it was written to catch had already been closed by Layer 1's catalogue handlers |
| **Running the suites rather than writing them** | 2 | F-024, F-033 |
| **Everything before this round** | 25 | F-001 … F-025, each row saying how it was found |

**Two rows are worth reading against each other.** Layer 1 swept every request the panel can make
and found **nothing** — the panel sends what `docs/consumer-contract.md` says it sends, on all
forty-two endpoints. Layer 3 asked the same forty-two what happens when the *answer* is wrong and
found four defects. The panel's outgoing half is in good order; its assumptions about what comes
back are where the gaps are, which is the same sentence `F-002`, `F-021` and `F-022` have been
writing one defect at a time.

**And one row is a measurement of the tools, not the panel.** Layer 4 found `F-037` — targets
under 24x24 on every route — while axe's own `target-size` rule passed all eight. axe grants
exceptions for spacing and inline targets; a blunt `getBoundingClientRect` does not. Running one
tool and reporting a green would have been wrong in a way nothing in the report would have shown.


## Run log

| Date | Scope | Result |
| --- | --- | --- |
| 2026-09-09 | `npm run check`, `npm test`, `npm run test:e2e`, `npm run test:coverage` | Pass — **47 test files, 1137 tests, 3 skipped**; **10 Playwright specs, 68 tests**; coverage **92.96 / 86.46 / 91.52 / 94.61**. Final state after the five-layer test package. Every axis of coverage up on the previous entry. The three skipped are the list-cardinality cases on the dashboard, whose read answers with an object rather than a list. |
| 2026-09-09 | `npx vitest run src/App.integration.test.tsx`, 25 times unloaded, then 8 times under CPU saturation | Pass — 25/25 and 8/8. Measured while identifying `F-024`: the flake does **not** reproduce on the file alone, loaded or not, which is what points at the full suite's own parallelism rather than at the machine. |
| 2026-09-09 | `npm test`, 10 times with this round's new files and MSW slice removed | **One failure in ten** — `src/App.integration.test.tsx:109`. The baseline measurement for `F-024`: the flake predates this round's changes, so the rate is not something the new tests introduced. |
| 2026-09-09 | `npm run test:e2e`, 4 times | **One failure in four**, then three green — `e2e/moderating-a-comment.spec.ts:33`. `F-033`. |
| 2026-09-09 | `npm test` with the pipeline's `VITE_API_BASE_URL` exported | Pass — 43 test files, 348 tests. Before the fix the same command reproduced CI exactly: 30 failures across the six files that use the request recorder. `F-025`. |
| 2026-09-09 | `npm run check`, `npm test`, `npm run test:e2e`, `npm run build`, coverage | Pass — 43 test files, 348 tests, 11 Playwright tests, coverage **92.55 / 85.62 / 90.77 / 94.43**, clean build. Final state after the delivery documentation pass. Coverage re-measured and the per-directory table regenerated from `coverage/coverage-summary.json` rather than transcribed. |
| 2026-09-09 | `npx vitest run .integration.test.`, ten times | **One failure in ten.** The first run reported `1 failed | 165 passed`; the nine that followed were green and the failing test was never identified. `F-024`. Recorded because a suite that fails once in ten is not a green suite. |
| 2026-09-09 | `npm run check`, `npm test`, `npm run test:e2e`, `npm run build` | Pass — 43 test files, 348 tests, 11 Playwright tests, clean build. After the `P0b` package: the bodyless writes, the audit open-map guard, and the two measured-not-fixed null cases. |
| 2026-09-09 | `npm run check`, `npm test`, `npm run test:e2e`, `npm run build` | Pass — 42 test files, 333 tests, 11 Playwright tests, clean build. After the `A2` alert region; `src/layouts` has its first test. |
| 2026-09-09 | The session notice in Chromium at 320, 768 and 1440 | **Partial.** At 1440 the notice measures 55.7px, and 135.4px beside a page-level error; nothing is pushed off screen, there is no horizontal overflow, and text contrast is 14.41:1. At 320 and 768 it could not be assessed **because the panel is not visible at those widths** — `F-019`. Recorded as not checked, not as passing. |
| 2026-09-09 | `npm run check`, `npm test`, `npm run test:e2e`, `npm run build` | Pass — 41 test files, 329 tests, 11 Playwright tests, no lint or type errors, clean build. After the `P0a` session-path package; eight new tests, each seen red first. Coverage not re-measured, so the table below is still the figure from the previous package. |
| 2026-09-09 | `npm run test:e2e` (Playwright, Chromium) | Pass — 4 specs, 11 tests, against the in-browser mock backend. Covers E2E-4, E2E-5, E2E-11, E2E-12 and E2E-13. |
| 2026-09-09 | `npm run check`, `npm test`, `npm run build`, coverage | Pass — 41 test files, 321 tests, coverage 92.27 / 85.10 / 90.50 / 94.18, no lint or type errors, clean build. After the MSW migration. |
| 2026-09-09 | Moderation reports filter in Chromium, longest option selected | Pass — "Inappropriate Content" fits the control with no overflow (`scrollWidth === clientWidth`, 218 = 218). Verifies the fix for the clipped filter; `F-012` records the separate clipping found in the same screenshot. |
| 2026-09-09 | `npm run check`, `npm test`, `npm run build`, coverage | Pass — 41 test files, 320 tests, coverage 92.06 / 84.62 / 90.37 / 93.94, no lint or type errors, clean build. After the Entwurf pass; `check` now also runs the no-cycles and documentation checks. |
| 2026-09-09 | Login page in Chromium at 320px and 1280px | Pass — the sign-in card fits inside a 320px viewport with margin on both sides, and is unchanged at 400px wide on the desktop width. Verifies the fix for the fixed-width overflow. |
| 2026-09-08 | `npm run check`, `npm test`, `npm run build` | Pass — 33 test files, 244 tests, no lint or type errors. |
| 2026-09-08 | Manual scenarios E2E-1 … E2E-10 | **Not run.** No scenario in section 6 of the test plan has been executed against the deployed backend yet. |
| 2026-09-09 | `npm test` on untouched `main` | **Fail** — 1 of 263 tests red (F-004). The "33 files, 244 tests" recorded on 2026-09-08 was already stale; the suite was 37 files / 263 tests. |
| 2026-09-09 | `npm run check`, `npm test` after refactor step 0 | Pass — 37 test files, 263 tests, no lint or type errors. |
| 2026-09-09 | `npm run test:coverage` — baseline before the refactor | 88.56% statements, 81.24% branches, 84.27% functions, 91.63% lines. Per directory below. |
| 2026-09-09 | `npm run check`, `npm test`, `npm run build` after refactor steps 0–7 | Pass — 36 test files, 260 tests, no lint or type errors, production build clean. |
| 2026-09-09 | `npm run test:coverage` after refactor steps 0–7 | **89.58% / 83.14% / 86.48% / 92.12%** — up on every axis against the baseline. |
| 2026-09-09 | `npm test` after `npm install` | **Fail to import** — 5 files could not resolve `@tanstack/react-query`; `node_modules` predated the step 3–4 dependency additions, and `src/api/logs/index.ts` had never been committed because `.gitignore` hid the directory. Both fixed; see the changelog. |
| 2026-09-09 | `npm run check`, `npm test`, `npm run build` after refactor steps 8–11 | Pass — 37 test files, 273 tests, no lint or type errors, production build clean. |
| 2026-09-09 | `npm run test:coverage` after the whole refactor | **91.23% statements / 84.16% branches / 89.03% functions / 93.49% lines** — up on every axis against the baseline. |
| 2026-09-09 | `npm run check`, `npm test`, `npm run build` after the P0 cleanup | Pass — 37 test files, 273 tests, no lint or type errors, **zero compiler or build warnings**, production build clean in 655 ms. |
| 2026-09-09 | `npm run test:coverage` after the P0 cleanup | **91.23% / 84.16% / 89.03% / 93.49%** — unchanged, as expected for a documentation-and-comment change. Per directory below. |
| 2026-09-09 | Manual scenarios E2E-1 … E2E-13 | **Not run.** No scenario in section 7 of the test plan has been executed against the deployed backend. Recorded as not run, not assumed to pass. |

## Coverage

Measured with `npm run test:coverage`. **The report in `coverage/` is the
authority**; the tables here are dated snapshots of it, per section 0 of
[testplan.md](testplan.md).

### Current — 2026-09-09, after the five-layer test package

**All files: 92.96 statements / 86.46 branches / 91.52 functions / 94.61 lines**

| Directory | % Stmts | % Branch | % Funcs | % Lines |
| --- | --- | --- | --- | --- |
| **All files** | **92.96** | **86.46** | **91.52** | **94.61** |
| `src` | 71.43 | 33.33 | 66.67 | 72.73 |
| `src/api/auth` | 95.83 | 92.86 | 100.00 | 95.45 |
| `src/api/catalog` | 100.00 | 100.00 | 100.00 | 100.00 |
| `src/api/client` | 99.15 | 94.59 | 100.00 | 99.10 |
| `src/api/feedback` | 100.00 | 100 | 100.00 | 100.00 |
| `src/api/logs` | 100.00 | 94.44 | 100.00 | 100.00 |
| `src/api/moderation` | 100.00 | 100 | 100.00 | 100.00 |
| `src/api/system` | 100.00 | 88.89 | 100.00 | 100.00 |
| `src/api/users` | 100.00 | 100.00 | 100.00 | 100.00 |
| `src/assets` | 100 | 100 | 100 | 100 |
| `src/components` | 94.03 | 95.65 | 88.89 | 93.85 |
| `src/constants` | 100.00 | 83.33 | 100.00 | 100.00 |
| `src/context` | 97.87 | 94.12 | 100.00 | 100.00 |
| `src/domain` | 100.00 | 93.33 | 100.00 | 100.00 |
| `src/features/audit-logs` | 81.82 | 81.08 | 73.68 | 86.84 |
| `src/features/audit-logs/components` | 77.55 | 80.00 | 63.33 | 84.62 |
| `src/features/audit-logs/components/details` | 91.30 | 78.57 | 100.00 | 90.91 |
| `src/features/audit-logs/hooks` | 84.62 | 89.29 | 92.86 | 86.49 |
| `src/features/auth` | 100.00 | 100.00 | 100.00 | 100.00 |
| `src/features/auth/components` | 100.00 | 100.00 | 100.00 | 100.00 |
| `src/features/auth/hooks` | 95.12 | 90.48 | 100.00 | 100.00 |
| `src/features/catalog` | 95.83 | 82.61 | 88.89 | 95.00 |
| `src/features/catalog/components` | 93.10 | 66.67 | 91.84 | 94.94 |
| `src/features/catalog/hooks` | 85.96 | 80.49 | 88.89 | 85.96 |
| `src/features/catalog/model` | 92.73 | 90.00 | 100.00 | 97.62 |
| `src/features/comments` | 100.00 | 100 | 100.00 | 100.00 |
| `src/features/dashboard` | 95.24 | 85.19 | 83.33 | 94.74 |
| `src/features/dashboard/components` | 100.00 | 83.33 | 100.00 | 100.00 |
| `src/features/dashboard/hooks` | 100.00 | 100.00 | 100.00 | 100.00 |
| `src/features/feedback` | 94.74 | 88.89 | 100.00 | 100.00 |
| `src/features/feedback/components` | 72.22 | 72.22 | 75.00 | 72.92 |
| `src/features/feedback/hooks` | 93.88 | 87.50 | 90.00 | 93.88 |
| `src/features/feedback/model` | 100.00 | 100.00 | 100.00 | 100.00 |
| `src/features/help` | 100.00 | 100.00 | 100.00 | 100.00 |
| `src/features/help/content` | 100.00 | 100 | 100 | 100.00 |
| `src/features/moderation` | 100.00 | 100.00 | 100.00 | 100.00 |
| `src/features/moderation/components` | 91.67 | 87.32 | 89.36 | 93.94 |
| `src/features/moderation/hooks` | 95.45 | 87.50 | 100.00 | 96.77 |
| `src/features/moderation/model` | 95.16 | 75.41 | 88.89 | 94.34 |
| `src/features/users` | 100.00 | 100.00 | 100.00 | 100.00 |
| `src/features/users/components` | 89.29 | 77.03 | 85.45 | 91.04 |
| `src/features/users/components/warnings` | 80.00 | 50.00 | 100.00 | 100.00 |
| `src/features/users/hooks` | 91.06 | 83.87 | 94.12 | 95.15 |
| `src/features/users/model` | 79.17 | 91.89 | 60.00 | 89.19 |
| `src/hooks` | 100.00 | 100.00 | 100.00 | 100.00 |
| `src/layouts` | 100.00 | 100.00 | 100.00 | 100.00 |
| `src/layouts/components` | 90.32 | 91.30 | 81.82 | 90.32 |
| `src/theme` | 100.00 | 100 | 100 | 100.00 |
| `src/utils` | 98.18 | 92.31 | 100.00 | 97.62 |

**Generated from `coverage/coverage-summary.json`, and it is produced by the documented command
now.** It was not: `vite.config.ts` listed `['text', 'html', 'lcov']` as its reporters, with no
`json-summary`, while this document, [testplan.md](testplan.md) §6 and `CHANGELOG.md` all said
the table was aggregated from that file. The one on disk was a leftover from a one-off
invocation, so the next person to follow the procedure would have re-published a stale table
without knowing. `json-summary` is in the reporter list now.

What the table makes visible, read against the previous one below:

- **Every axis is up** — 92.55 → 92.96 statements, 85.62 → 86.46 branches, 90.77 → 91.52
  functions, 94.43 → 94.61 lines — and none of it was aimed at coverage. It is the side effect
  of five layers that drive real code paths: the response-shape layer alone walks every branch
  of `ApiResponseParser` and the whole error taxonomy.
- **`src/api/catalog` reached 100% on all four axes**, from a directory whose page still replaces
  its service module. That is the MSW catalogue slice added for Layer 1's sweep, not a new
  feature test — the same accidental coverage `F-023` produced for `src/api/feedback`, and worth
  the same caveat: the *requests* are exercised, nothing about the catalogue screen is.
- **`src` is still the weakest row** (33.33% branches) and still the same two files, `App.tsx`
  and `query.ts`, whose uncovered lines are the retry predicate the test client turns off.
  Unchanged, and unchanged deliberately.
- **`src/features/feedback/components` is still the weakest feature directory** (72.22%), for the
  reason recorded last round: `FeedbackPage.integration.test.tsx` still replaces its service, so
  nothing drives `BugReportEditForm` through a real response. The new layers reach that screen
  only through the routes, which is enough to render it and not enough to fill in its form.

### Previous — 2026-09-09, after the `P0a` and `P0b` packages

**All files: 92.55 statements / 85.62 branches / 90.77 functions / 94.43 lines**
(1790/1934, 911/1064, 728/802, 1647/1744). Up on every axis from the 92.27 / 85.10 /
90.50 / 94.18 recorded after the MSW migration. **The report in `coverage/` is the
authority; this is a dated snapshot of it.**

| Directory | % Stmts | % Branch | % Funcs | % Lines |
| --- | --- | --- | --- | --- |
| **All files** | **92.55** | **85.62** | **90.77** | **94.44** |
| `src` | 71.43 | 33.33 | 66.67 | 72.73 |
| `src/api/auth` | 95.83 | 92.86 | 100 | 95.45 |
| `src/api/catalog` | 100 | 100 | 100 | 100 |
| `src/api/client` | 98.31 | 93.24 | 100 | 99.1 |
| `src/api/feedback` | 100 | 100 | 100 | 100 |
| `src/api/logs` | 100 | 94.44 | 100 | 100 |
| `src/api/moderation` | 100 | 100 | 100 | 100 |
| `src/api/system` | 100 | 88.89 | 100 | 100 |
| `src/api/users` | 100 | 100 | 100 | 100 |
| `src/components` | 94.03 | 95.65 | 88.89 | 93.85 |
| `src/constants` | 100 | 50 | 100 | 100 |
| `src/context` | 97.87 | 94.12 | 100 | 100 |
| `src/domain` | 100 | 93.33 | 100 | 100 |
| `src/features/audit-logs` | 81.82 | 81.08 | 73.68 | 86.84 |
| `src/features/audit-logs/components` | 77.55 | 75 | 63.33 | 84.62 |
| `src/features/audit-logs/components/details` | 91.3 | 78.57 | 100 | 90.91 |
| `src/features/audit-logs/hooks` | 84.62 | 89.29 | 92.86 | 86.49 |
| `src/features/auth` | 100 | 100 | 100 | 100 |
| `src/features/auth/components` | 100 | 100 | 100 | 100 |
| `src/features/auth/hooks` | 95.12 | 90.48 | 100 | 100 |
| `src/features/catalog` | 95.83 | 82.61 | 88.89 | 95 |
| `src/features/catalog/components` | 91.95 | 64.29 | 89.8 | 93.67 |
| `src/features/catalog/hooks` | 85.96 | 80.49 | 88.89 | 85.96 |
| `src/features/catalog/model` | 92.73 | 90 | 100 | 97.62 |
| `src/features/comments` | 100 | 100 | 100 | 100 |
| `src/features/dashboard` | 95.24 | 85.19 | 83.33 | 94.74 |
| `src/features/dashboard/components` | 100 | 83.33 | 100 | 100 |
| `src/features/dashboard/hooks` | 100 | 100 | 100 | 100 |
| `src/features/feedback` | 94.74 | 88.89 | 100 | 100 |
| `src/features/feedback/components` | 72.22 | 72.22 | 75 | 72.92 |
| `src/features/feedback/hooks` | 93.88 | 87.5 | 90 | 93.88 |
| `src/features/feedback/model` | 100 | 100 | 100 | 100 |
| `src/features/help` | 100 | 100 | 100 | 100 |
| `src/features/help/content` | 100 | 100 | 100 | 100 |
| `src/features/moderation` | 100 | 100 | 100 | 100 |
| `src/features/moderation/components` | 91.67 | 85.92 | 89.36 | 93.94 |
| `src/features/moderation/hooks` | 95.45 | 87.5 | 100 | 96.77 |
| `src/features/moderation/model` | 95.16 | 75.41 | 88.89 | 94.34 |
| `src/features/users` | 91.67 | 88.89 | 100 | 90 |
| `src/features/users/components` | 88.57 | 75.68 | 83.64 | 90.3 |
| `src/features/users/components/warnings` | 80 | 50 | 100 | 100 |
| `src/features/users/hooks` | 91.06 | 83.87 | 94.12 | 95.15 |
| `src/features/users/model` | 79.17 | 91.89 | 60 | 89.19 |
| `src/hooks` | 100 | 100 | 100 | 100 |
| `src/layouts` | 82.61 | 100 | 60 | 100 |
| `src/layouts/components` | 90.32 | 91.3 | 81.82 | 90.32 |
| `src/theme` | 100 | 100 | 100 | 100 |
| `src/utils` | 98.18 | 89.74 | 100 | 97.62 |

**This table is generated from `coverage/coverage-summary.json`, not transcribed.**
Every earlier version of it was typed out of the terminal reporter, which omits a
directory whose files are all fully covered — so the seven directories then sitting at
100% were missing, and anyone reading the output as a list of every directory drew the
wrong conclusion. Aggregating the JSON removes both the omission and the transcription
error; the figures below are every directory under `src/`, including the fully covered
ones.

What the table makes visible:

- **`src` itself is the weakest row** (33.33% branches), and it is two files:
  `App.tsx` and `query.ts`. `query.ts`'s uncovered lines are the retry predicate —
  the policy in [ADR 0001](adr/0001-tanstack-query-as-the-data-layer.md) — which no
  test exercises because the test client turns retries off. That is a real gap and
  a cheap one to close.
- **`src/features/feedback/components` is the weakest feature directory** (72.22%),
  concentrated in `BugReportEditForm` (9.09% statements) and `BugReportDetails`
  (44.44%). The feature's *model* is well covered at 100%; its form is not, and
  `FeedbackPage.integration.test.tsx` still replaces its service module, so nothing
  drives the form through a real response.
- **`src/features/users/model` and `src/layouts` share the weakest function coverage**
  at 60%. `src/layouts` had **none at all** until this round — the shell now has four
  tests, which is why a figure exists to be weak rather than absent. `users/model` is
  unchanged and remains the cheapest thing in the project to test.
- **`src/api/feedback` reached 100%, and it is worth saying why.** It sat at 83.33%
  with `GitlabIssueService.ts` at **0%** for the whole project, because the service is
  reachable only through a control hidden when `gitlabEnabled` is false and no test
  turned it on. It was covered as a **side effect** of `F-023`, which had to call all
  five bodyless writes at the service layer to assert their headers. Coverage that
  arrives by accident is still coverage, but it is worth recording that nothing about
  the GitLab *feature* is tested — only that its request goes out with the right shape.

### Baseline — 2026-09-09, before the refactor

Kept for comparison. The refactor was required not to drop below it, and did not:
every axis is up.

| Directory | % Stmts | % Branch | % Funcs | % Lines |
| --- | --- | --- | --- | --- |
| **All files** | **88.56** | **81.24** | **84.27** | **91.63** |
| `src` | 88.88 | 100 | 75 | 85.71 |
| `src/api` | 97.35 | 94.30 | 97.41 | 97.66 |
| `src/components` | 91.66 | 95.65 | 82.75 | 91.30 |
| `src/context` | 96.55 | 89.74 | 100 | 100 |
| `src/domain` | 89.18 | 68.96 | 66.66 | 88.57 |
| `src/features/auth` | 97.36 | 92.30 | 100 | 97.05 |
| `src/hooks` | 93.18 | 68.96 | 97.14 | 94.01 |
| `src/layouts` | 70.58 | 100 | 44.44 | 100 |
| `src/utils` | 95.65 | 81.25 | 100 | 97.05 |

Two things it made visible at the time, both since acted on:
`src/components/errorBoundaryLogger.ts` was at 0% — dead code, wired up in refactor
step 3 — and `src/layouts` had the weakest function coverage, which it still does.

### Thresholds

There are none in `vite.config.ts` yet, deliberately. The refactor's only safety net
was `npm test` passing after every step, and a suite red by design cannot provide
one. Adding them is `P5`, at the figures the panel already meets rather than at
aspirational ones: **89.58 / 83.14 / 86.48 / 92.12**, the floor recorded mid-refactor.
