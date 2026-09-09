# Test Findings

Results and defects from executing `docs/testplan.md`. One row per finding, with
the newest first. A finding is closed only when the fix is described in
`CHANGELOG.md` and the scenario has been re-run.

**Severity** — *Blocker*: the panel cannot be used or a permission is wrong.
*Major*: a feature is broken or misleading. *Minor*: cosmetic or an edge case.

## Open

| ID | Date | Area | Scenario | Severity | Finding |
| --- | --- | --- | --- | --- | --- |
| F-024 | 2026-09-09 | Test suite | Automated suite | Minor | **One flaky run, not reproduced.** `npx vitest run .integration.test.` reported `1 failed | 165 passed` once, while the full `npm test` was green immediately before and after. Nine consecutive runs of the same filtered command afterwards were all green, and the failing test was never identified — the summary line was captured, the failure detail was not. Recorded rather than dismissed: a suite that fails once in ten is not a green suite, and a count that looks clean is worth less than the note saying it was not always. No cause identified; the most likely candidates are the shared module-level state the MSW handlers use for the session and the store, both reset per test but per *file* in load order. Deferred: cost is unknown until it reproduces, which is why it is recorded rather than scheduled. |
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
| F-013 | 2026-09-09 | Authentication / session | E2E-4 | Major | **A session check that fails without being refused is completely silent.** `AuthContext` acts only on `UnauthorizedError`, so a `401` ends the session and every other failure of `GET /auth/me` — a `404`, a `403`, a payload the panel cannot read — leaves `checking` flipping to false with nothing recorded. The operator keeps working against the account copy captured at sign-in, which nothing has confirmed, and is told nothing. Keeping the session is deliberate and stays; the silence was not a decision, it was the absence of one. This matters now because the backend restored legacy `/auth/me` as an alias: the panel needs no change, and the way to know that is a test rather than a document — `docs/consumer-findings.md` C-01 records two documents in this repository contradicting each other on whether the path still exists. | Fixed across the `P0a` package. The provider carries `sessionCheckError`, and `AdminLayout` renders it as a dismissible warning strip inside the content gutters — the same `ErrorAlert` a page uses for its own errors, at a new `warning` level. Which failures are worth saying out loud is decided by `transient` rather than by a status, so a blip cannot drown the notice that matters. Pinned by four provider tests and four shell tests, including that focus returns to the main landmark rather than `document.body` when the notice is dismissed. Seen in Chromium at 1440px, alone and beside a page-level error. |
| F-015 | 2026-09-09 | Authentication / session | E2E-4 | Major | **A sign-in reported as failed left a live bearer token on the client.** The token has to be installed before `/auth/me` can be asked with it, so `authenticateAdmin` set it and only then resolved the identity. When that read failed the function threw, the login screen said the sign-in had failed — and `ApiClient` went on sending the token on every subsequent request. Found by reading the ordering while fixing `F-014`, not by a failing test. | Fixed in the `P0a` package. The identity read is wrapped, and a failure clears the token before rethrowing. Pinned by a test asserting `setToken` was last called with `null` after a failed read. |
| F-014 | 2026-09-09 | Authentication / session | E2E-4 | Major | **Four different sign-in failures collapsed into one sentence, and three of them were wrong.** `readSessionUser` wrapped `/auth/me` in a bare `catch` returning `null`, which `resolveAdminUser` turned into "Signed in, but your admin account could not be read. Try again in a moment." A `403` means the backend refuses this account the panel, and the account is readable; a `404` means the address the panel asks at is gone, and no number of retries will help; a `401` means the token minted seconds earlier is already refused, so waiting a moment is the one thing that cannot work. Worse, the bare `catch` discarded the **type** as well as the message, so `getLoginErrorMessage` — which already knows a `ForbiddenError` means "not authorized" — could no longer recover the right wording downstream. | Fixed in the `P0a` package. `readSessionUser` discriminates on the error type, not on a status: `ForbiddenError` is passed on untouched so the one function that owns that wording still decides it, `NotFoundError` and `UnauthorizedError` each get a sentence that is true, and everything else keeps the original message. This is ADR 0013's criterion met by a later change rather than by its own commit. Pinned by four tests in `authenticateAdmin.unit.test.ts`. |
| F-009 | 2026-09-09 | Catalogue / deletion | Automated suite | Major | **The delete dispatcher had no exhaustive check, and a fourth deletion kind would have deleted a rating.** `getCatalogDeletion` chose the confirmation wording with an exhaustive `switch` on `CatalogDeletion['type']`. `CatalogPage` then chose the *call* with a second dispatch over the same discriminant, written as two `if`s and a bare `return ratings.remove(...)`. Adding a fourth kind of deletion would have produced correct wording from the first dispatch and fallen through the second into deleting a rating. Found by reading, not by a test — nothing exercised a fourth kind, because there is not one yet. | Fixed in the Entwurf pass. `getCatalogDeletion` takes the three deleters and binds the call alongside the wording, so the two cannot disagree, and `assertNever` makes a fourth kind a compile error. Pinned by a dispatch test in `deletion.unit.test.ts` asserting each kind reaches its own deleter and no other. |
| F-008 | 2026-09-09 | All tables / keyboard | E2E-5 | Major | **Pressing Enter on a control inside a table row ran the row's action instead.** `activateOnEnterOrSpace` matched any Enter or Space that reached a clickable row, including keystrokes that had *bubbled* from a focusable descendant, and called `preventDefault()` before acting. A keyboard user who tabbed to a row's author chip and pressed Enter got the row's edit dialog: `preventDefault` suppressed the browser's synthetic click on the chip, so the chip's own handler never ran, and the row's did. The equivalent mouse path had been shielded with `stopPropagation` since it was written; the key path never was. Affected `ContentRow`, `LectureTableRow` and `ProfessorTableRow`, which have focusable descendants; `UserTableRow` and `AuditLogRow` were spared only because they have none. | Fixed in the Entwurf pass. The predicate is split out as `isOwnActivation` and tests `event.target === event.currentTarget`, so a bubbled keypress is left entirely alone — not acted on and not `preventDefault`ed, so the browser still turns it into a click on the control that is actually focused. Pinned by `keyboard.unit.test.ts` and `ClickableRow.unit.test.tsx`. |
| F-007 | 2026-09-09 | Help page | E2E-13 | Minor | **The Help page described a dashboard card that does not exist.** `help/content/dashboard.ts` documented a card called "Not blocked", coloured yellow for admin accounts. The dashboard renders "Active accounts" and uses `KIT.orange`. The Help page's colour tables were seven hand-written transcriptions of `constants/colors.ts` typed as bare `string`, so six agreed by luck and the seventh had drifted with nothing to catch it. | Fixed in the Entwurf pass. Every value row reads the real map, the card names are one constant read by both the grid and the Help content, and the refresh interval in the summary is computed from `REFRESH_INTERVAL_MS` rather than retyped. |
| F-004 | 2026-09-09 | Help page | Automated suite | Major | **The suite was red on `main`.** `HelpPage.integration.test.tsx` asserted a collapsed accordion section's text was `not.toBeInTheDocument()`. Mantine 9 keeps `Accordion.Panel` content mounted and hides it rather than unmounting it, so the text is present but invisible — the assertion described Mantine 8. Found while establishing a baseline for the refactor, not by a change. | Fixed in refactor step 0. The assertion is now `not.toBeVisible()`, which states what the test always meant: the sections start collapsed. Suite green at 37 files / 263 tests. |
| F-003 | 2026-09-05 | Users / edit form | E2E-2 | Major | **Credibility score was locked on admin accounts.** Only an admin's *status* is reserved for an elevated operator; a username, biography, credibility score or a demotion to `STUDENT` are accepted from any admin. The edit form applied one `accessLocked` flag to all of them, hiding fields from edits the backend would have taken. | Fixed in `bce01e6`. `UserEditForm` splits `accessLocked` into `statusLocked` and a plain `isSelf` check. Pinned by a test in `UsersPage.integration.test.tsx` that an ordinary admin sees an admin's status locked but the credibility score editable. |
| F-002 | 2026-09-05 | Authentication | E2E-4 | Blocker | **The panel signed the operator out on every reload.** `/auth/me` reports `username` / `kitEmail`, but `AuthUser` read `name` / `email`. Both were `undefined`, so `isAuthUser` rejected the stored session on the next load, the sidebar fell back to `Unknown account`, and the elevated permission was computed from an empty address — it had never reached the UI at all. | Fixed in `451bfb2`. `me()` reads either spelling and maps the payload onto `AuthUser`. Pinned by `AuthService.unit.test.ts` (both spellings, absent flag becomes `false`) and `AuthContext.unit.test.tsx`. |

## Run log

| Date | Scope | Result |
| --- | --- | --- |
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

### Current — 2026-09-09, after the `P0a` and `P0b` packages

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
