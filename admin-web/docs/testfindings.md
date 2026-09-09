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
| F-003 | 2026-09-05 | Users / edit form | E2E-2 | Major | **Credibility score was locked on admin accounts.** Only an admin's *status* is reserved for an elevated operator; a username, biography, credibility score or a demotion to `STUDENT` are accepted from any admin. The edit form applied one `accessLocked` flag to all of them, hiding fields from edits the backend would have taken. | Fixed in `bce01e6`. `UserEditForm` splits `accessLocked` into `statusLocked` and a plain `isSelf` check. Pinned by a test in `UsersPage.integration.test.tsx` that an ordinary admin sees an admin's status locked but the credibility score editable. |
| F-002 | 2026-09-05 | Authentication | E2E-4 | Blocker | **The panel signed the operator out on every reload.** `/auth/me` reports `username` / `kitEmail`, but `AuthUser` read `name` / `email`. Both were `undefined`, so `isAuthUser` rejected the stored session on the next load, the sidebar fell back to `Unknown account`, and the elevated permission was computed from an empty address — it had never reached the UI at all. | Fixed in `451bfb2`. `me()` reads either spelling and maps the payload onto `AuthUser`. Pinned by `AuthService.unit.test.ts` (both spellings, absent flag becomes `false`) and `AuthContext.unit.test.tsx`. |

## Run log

| Date | Scope | Result |
| --- | --- | --- |
| 2026-09-08 | `npm run check`, `npm test`, `npm run build` | Pass — 33 test files, 244 tests, no lint or type errors. |
| 2026-09-08 | Manual scenarios E2E-1 … E2E-10 | **Not run.** No scenario in section 6 of the test plan has been executed against the deployed backend yet. |
