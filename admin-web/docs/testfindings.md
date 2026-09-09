# Test Findings

Results and defects from executing `docs/testplan.md`. One row per finding, with
the newest first. A finding is closed only when the fix is described in
`CHANGELOG.md` and the scenario has been re-run.

**Severity** — *Blocker*: the panel cannot be used or a permission is wrong.
*Major*: a feature is broken or misleading. *Minor*: cosmetic or an edge case.

## Open

| ID | Date | Area | Scenario | Severity | Finding |
| --- | --- | --- | --- | --- | --- |
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

## Coverage baseline

Recorded before the refactor so each step can be checked against it; the numbers
must not drop. Measured with `npm run test:coverage` on 2026-09-09.

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

The baseline is already close to the targets `docs/TODO.md` sets (lines 90 /
branches 85 / functions 90 / statements 90), which is why it is usable as a
refactor safety net. Two facts it makes visible:

- `src/components/errorBoundaryLogger.ts` is at **0%** — it is dead code. It
  exports `logRenderError`, which nothing imports, while `ErrorBoundary` inlines
  its own `console.error`. Removed in refactor step 3.
- `src/layouts` has the weakest function coverage (44.44%), matching the gap
  already recorded in `docs/TODO.md`.
