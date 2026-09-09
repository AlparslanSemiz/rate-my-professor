# Test Findings

Results and defects from executing `docs/testplan.md`. One row per finding, with
the newest first. A finding is closed only when the fix is described in
`CHANGELOG.md` and the scenario has been re-run.

**Severity** — *Blocker*: the panel cannot be used or a permission is wrong.
*Major*: a feature is broken or misleading. *Minor*: cosmetic or an edge case.

## Open

| ID | Date | Area | Scenario | Severity | Finding |
| --- | --- | --- | --- | --- | --- |
| F-006 | 2026-09-09 | Catalogue / contract | E2E-8 | Minor | **`G1` is already answered by an endpoint the panel does not call.** `docs/backend-tasks.md` asks the backend for a way to read inactive catalogue records. The backend's own `docs/admin-api.md` documents `GET /admin/data/lectures/all` and `GET /admin/data/professor/all` as "Every lecture/professor, active or not" — they exist and are admin-only. The panel still reads `GET /data/lectures` and `GET /data/professor`, which filter on `active = true`, so switching a record off still removes it from the only list the panel can see. The gap is now a panel-side change, not a backend request. Blocked behind `F-005`, since moving to those paths is part of the same migration. |
| F-005 | 2026-09-09 | API contract | — | Major | **The panel calls legacy paths the backend intends to remove.** The backend now serves every administrative route under an `/admin` prefix as well as its old path, and its `docs/admin-api.md` states the legacy paths "are removed once [the panel] has [moved]". The panel still sends `/users`, `/auth/me`, `/audit-logs`, `/reports`, `/ratings`, `/system/status` and `/data/lectures`. Nothing is broken today; the panel breaks entirely on the day the legacy routes are dropped. Found while establishing the contract artefact for `P1`, by reading the backend document rather than by a failing test — which is exactly the gap `P1` exists to close. Migrating is mechanical but is a behaviour change, so it is a decision for the maintainer, recorded in [TODO.md](TODO.md) under "Deliberately not done". |
| F-001 | 2026-09-08 | Users / permissions | E2E-1 | Blocker until verified | **The elevated operator has never been confirmed end to end against the deployed backend.** The backend reports `isSuperAdmin` on `/auth/me` and the panel reads it, but no one has yet signed in as `u-kisi4@student.kit.edu` and actually warned, blocked, unblocked and deleted a real admin account, edited its status and credibility score, and checked that the audit log names the right actor. Until that run happens the feature is implemented, not verified. Tracked as the Blocking item in `docs/TODO.md`. |

## Resolved

| ID | Date | Area | Scenario | Severity | Finding | Resolution |
| --- | --- | --- | --- | --- | --- | --- |
| F-004 | 2026-09-09 | Help page | Automated suite | Major | **The suite was red on `main`.** `HelpPage.integration.test.tsx` asserted a collapsed accordion section's text was `not.toBeInTheDocument()`. Mantine 9 keeps `Accordion.Panel` content mounted and hides it rather than unmounting it, so the text is present but invisible — the assertion described Mantine 8. Found while establishing a baseline for the refactor, not by a change. | Fixed in refactor step 0. The assertion is now `not.toBeVisible()`, which states what the test always meant: the sections start collapsed. Suite green at 37 files / 263 tests. |
| F-003 | 2026-09-05 | Users / edit form | E2E-2 | Major | **Credibility score was locked on admin accounts.** Only an admin's *status* is reserved for an elevated operator; a username, biography, credibility score or a demotion to `STUDENT` are accepted from any admin. The edit form applied one `accessLocked` flag to all of them, hiding fields from edits the backend would have taken. | Fixed in `bce01e6`. `UserEditForm` splits `accessLocked` into `statusLocked` and a plain `isSelf` check. Pinned by a test in `UsersPage.integration.test.tsx` that an ordinary admin sees an admin's status locked but the credibility score editable. |
| F-002 | 2026-09-05 | Authentication | E2E-4 | Blocker | **The panel signed the operator out on every reload.** `/auth/me` reports `username` / `kitEmail`, but `AuthUser` read `name` / `email`. Both were `undefined`, so `isAuthUser` rejected the stored session on the next load, the sidebar fell back to `Unknown account`, and the elevated permission was computed from an empty address — it had never reached the UI at all. | Fixed in `451bfb2`. `me()` reads either spelling and maps the payload onto `AuthUser`. Pinned by `AuthService.unit.test.ts` (both spellings, absent flag becomes `false`) and `AuthContext.unit.test.tsx`. |

## Run log

| Date | Scope | Result |
| --- | --- | --- |
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

### Current — 2026-09-09, after the whole refactor and the P0 cleanup

**All files: 91.23 statements / 84.16 branches / 89.03 functions / 93.49 lines**
(1686/1848, 882/1048, 690/775, 1552/1660).

| Directory | % Stmts | % Branch | % Funcs | % Lines |
| --- | --- | --- | --- | --- |
| **All files** | **91.23** | **84.16** | **89.03** | **93.49** |
| `src` | 69.23 | 28.57 | 66.66 | 70 |
| `src/api/auth` | 95.83 | 92.85 | 100 | 95.45 |
| `src/api/client` | 96.51 | 92.98 | 96.66 | 97.5 |
| `src/api/feedback` | 83.33 | 100 | 77.77 | 83.33 |
| `src/api/logs` | 100 | 92.85 | 100 | 100 |
| `src/api/users` | 96.66 | 90 | 95.83 | 96.66 |
| `src/components` | 93.33 | 95 | 87.5 | 93.1 |
| `src/context` | 97.5 | 89.65 | 100 | 100 |
| `src/domain` | 100 | 93.33 | 100 | 100 |
| `src/features/audit-logs` | 79.62 | 78.43 | 75 | 86.36 |
| `src/features/audit-logs/components` | 75.51 | 65 | 61.29 | 82.05 |
| `src/features/audit-logs/components/details` | 86.95 | 71.42 | 100 | 90.9 |
| `src/features/audit-logs/hooks` | 84.61 | 89.28 | 92.85 | 86.48 |
| `src/features/auth` | 97.36 | 92.3 | 100 | 97.05 |
| `src/features/auth/hooks` | 95.12 | 90.47 | 100 | 100 |
| `src/features/catalog` | 92.85 | 81.48 | 90 | 95.45 |
| `src/features/catalog/components` | 88.17 | 64.28 | 83.63 | 91.56 |
| `src/features/catalog/hooks` | 86.2 | 80.48 | 88.88 | 86.2 |
| `src/features/catalog/model` | 94 | 92.3 | 100 | 100 |
| `src/features/comments` | 100 | 75 | 100 | 100 |
| `src/features/dashboard` | 94.44 | 85.18 | 83.33 | 93.75 |
| `src/features/dashboard/components` | 100 | 83.33 | 100 | 100 |
| `src/features/feedback` | 94.73 | 88.88 | 100 | 100 |
| `src/features/feedback/components` | 71.69 | 72.22 | 75 | 72.34 |
| `src/features/feedback/hooks` | 93.87 | 87.5 | 90 | 93.87 |
| `src/features/moderation/components` | 90.99 | 85.91 | 87.75 | 93.13 |
| `src/features/moderation/hooks` | 95.45 | 87.5 | 100 | 96.77 |
| `src/features/moderation/model` | 93.54 | 75.4 | 88.88 | 92.45 |
| `src/features/users` | 91.66 | 88.88 | 100 | 90 |
| `src/features/users/components` | 87.76 | 76.92 | 82.14 | 89.47 |
| `src/features/users/components/warnings` | 80 | 50 | 100 | 100 |
| `src/features/users/hooks` | 91.05 | 84.37 | 94.11 | 95.14 |
| `src/features/users/model` | 78.72 | 85.36 | 57.89 | 88.88 |
| `src/layouts` | 77.77 | 100 | 55.55 | 100 |
| `src/layouts/components` | 89.65 | 92 | 81.81 | 89.65 |
| `src/utils` | 95.65 | 81.25 | 100 | 97.05 |

**Seven directories are absent from this table because they are at 100% on all
four axes**, and the text reporter omits a directory whose files are all fully
covered: `src/theme`, `src/hooks`, `src/constants`, `src/features/help`,
`src/api/catalog`, `src/api/moderation`, `src/api/system`. Their figures were read
from the HTML report rather than inferred. Anyone reading the text output as a list
of every directory will draw the wrong conclusion, which is why this is written
down.

What the table makes visible:

- **`src` itself is the weakest row** (28.57% branches), and it is two files:
  `App.tsx` and `query.ts`. `query.ts`'s uncovered lines are the retry predicate —
  the policy in [ADR 0001](adr/0001-tanstack-query-as-the-data-layer.md) — which no
  test exercises because the test client turns retries off. That is a real gap and
  a cheap one to close.
- **`src/layouts` still has the weakest function coverage** (55.55%), matching the
  gap recorded here since the pre-refactor baseline. Nothing has been written for
  it; it is carried in [TODO.md](TODO.md).
- **`src/features/feedback/components` is the weakest feature directory** (71.69%),
  concentrated in `BugReportEditForm` (9.09% statements) and `BugReportDetails`
  (44.44%). The feature's *model* is well covered; its form is not.
- **`src/features/users/model` has 57.89% function coverage** — the lowest of any
  `model/` package, and models are the cheapest thing in the project to test.
- `src/api/feedback/GitlabIssueService.ts` is at **0%**. It is reachable only
  through the GitLab control, which is hidden when `gitlabEnabled` is false, and no
  test turns it on.

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
