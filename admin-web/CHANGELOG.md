# Changelog

## [Unreleased]

### Documentation — a fixed layout and the rule for keeping it current

Working notes were scattered across the repository root in ad-hoc files, some of
them in Turkish, and `README.md` filed requests against a `BACKEND-TASKS.md`
that did not exist here at all. They now have one place each, and a written rule
for keeping them up to date.

**`docs/`**
- `TODO.md` (was `tasks.md`) — open work. A `## Notebook` section at the top is
  reserved for the maintainer and is never edited by an agent.
- `backend-tasks.md` (was the untracked `backendtasks.md`) — now **tracked**,
  because it is the file handed to the backend team. Its closing Turkish note
  became the rule it stated: an elevated operator may change anything on another
  admin, an ordinary admin only on non-admin accounts. The gaps `README.md`
  already labelled F1, F2, F3 and G1 were folded in, so the backend team has one
  document instead of a reference to a missing one. The `/auth/me` `isSuperAdmin`
  section is marked done, since it shipped.
- `testplan.md` (new) — scope, the four test layers, the environment, a coverage
  matrix built from the real suite (33 files, 244 tests: 24 unit files / 136
  tests, 9 integration files / 108 tests), the automation gaps stated as fact,
  and ten manual end-to-end scenarios the stubbed suite cannot establish.
- `testfindings.md` (new) — the findings register, seeded with the unverified
  elevated operator (F-001, open) and the two defects already fixed: the reload
  sign-out (F-002) and the locked credibility score (F-003).

**`wiki.md`** (new, root)
- The self-contained copy published to the GitLab wiki. It duplicates `README.md`
  on purpose; the two are changed together.

**`CLAUDE.md`** (new, root, untracked)
- The working rules: a changelog entry on every change, work filed in
  `docs/TODO.md` below the untouched notebook, backend asks in
  `docs/backend-tasks.md`, test scope and results in their two files, English
  everywhere, and the conventions read off the existing history.

**Test strategy recorded, not started**
- `docs/TODO.md` gained a "Test strategy" section: twelve phases with their
  acceptance criteria, and the decisions behind them. The finding that prompted
  it — the suite has 244 tests but **no page test touches HTTP**, because all
  nine integration files mock the service modules with `vi.mock`, so nothing
  asserts the query parameters a screen actually sends. Coverage has never been
  measured; there is no baseline.
- `docs/testplan.md` says so in a new section rather than describing coverage the
  suite does not have. Its matrix still describes the suite as it is today.
- Nothing is implemented: a refactor comes first, and only Phase 1 (coverage
  infrastructure) is meant to land before it.

**`.gitignore`**
- Dropped the bare `TODO.md` pattern, which matched at any depth and would have
  kept `docs/TODO.md` out of the repository, and the superseded
  `BACKEND-TASKS.md`. `CLAUDE.md` stays ignored, as it was.

**`README.md`**
- The F1/F2/F3/G1 references now point at `docs/backend-tasks.md`.
- The project structure listed `src/features/answers/`, which does not exist, and
  omitted `src/features/help/`, which does. Answers are replies worked from the
  Comments screen — not a page chunk of their own, so the lazy-loading list no
  longer claims one.


### Added — elevated permissions for `u-kisi4@student.kit.edu`

One address may now act on **admin** accounts from the user profile, not only on
students: warn, block, unblock, delete, and change an admin's status. Nothing
about it is visible — the account is still reported and rendered as `ADMIN`
everywhere, with no new role, badge or label.

The permission is **the backend's to grant**. It resolves it from
`ADMIN_SUPERUSER_EMAILS` and reports it as `isSuperAdmin` on `/auth/me`; the
panel only reads it. An earlier draft of this feature kept its own address set,
which had to be edited in two repositories at once — that set is gone.

**`src/api/AuthService.ts`**
- `AuthUser` gained `isSuperAdmin?: boolean`. Optional, so a session stored
  before the backend reported it stays valid; an absent flag grants nothing.
- `me()` now maps the `/auth/me` payload onto `AuthUser` instead of casting it,
  so every caller sees one shape.

**`src/utils/adminAccess.ts`**
- Removed `SUPER_ADMIN_EMAILS` and `isSuperAdminEmail`. `REQUIRED_ADMIN_EMAILS`,
  `isRequiredAdminEmail`, `normalizeEmail` and `withRequiredAdminRole` are a
  different gate — who is offered a login code — and are untouched.

**`src/context/authSessionStorage.ts`**
- `isAuthUser` accepts the flag as an optional boolean, and rejects a stored
  payload carrying anything else under that name.

**`src/features/users/components/UserProfileModal.tsx`**
- `canActOnAdmins` now reads `currentAdmin?.isSuperAdmin === true` and is passed
  to `ProfileActions` and `UserEditForm` as before.

**`src/features/users/components/ProfileActions.tsx`**
- New `canActOnAdmins` prop. `isProtected` became
  `isSelf || (user.role === 'ADMIN' && !canActOnAdmins)`, so Warn / Block /
  Unblock / Delete account are offered on admin accounts to an elevated operator.

### Fixed

- **The panel signed the operator out on every reload.** `/auth/me` reports
  `username` / `kitEmail`, the names it also uses on `/users`, but `AuthUser`
  read `name` / `email`. Both were therefore `undefined`: `isAuthUser` rejected
  the stored session on the next load, the sidebar fell back to
  `Unknown account`, and `canActOnAdmins` was computed from an empty address —
  so the elevated permission had never actually reached the UI. `me()` now reads
  either spelling.
- **Credibility score was locked on admin accounts.** Only an admin's *status*
  is reserved for an elevated operator; a username, biography, credibility score
  or a demotion to `STUDENT` are accepted from any admin. `UserEditForm` split
  `accessLocked` into `statusLocked` and a plain `isSelf` check, so the field is
  no longer hidden from edits the backend would have taken.

### Unchanged on purpose

- **Self protection stays.** No one can change their own role or status, block
  or delete themselves, elevated or not.
- **The role label stays `ADMIN`.** No `SUPERADMIN` value entered `UserRole`,
  the role dropdown still offers Student / Admin only, and the sidebar, header,
  user table and audit log render exactly what they rendered before.
- **KIT email stays read-only** for everyone — it is the sign-in identity, and
  the backend keys elevation on it.
- The audit log's actor shape is unchanged; the backend's optional
  `metadata.elevated` is deliberately not rendered.
- No route or navigation gating changed; `ProtectedRoute` is still
  authentication-only.

### Tests

- `src/api/AuthService.unit.test.ts` — `/auth/me` is read in both the
  `username` / `kitEmail` and the older `name` / `email` spelling, an absent flag
  becomes `false`, and a payload with no usable `id` names nobody.
- `src/context/AuthContext.unit.test.tsx` — a stored session carrying the flag
  survives, one carrying a non-boolean is discarded, and an elevation `/auth/me`
  no longer reports is withdrawn from the stored copy.
- `src/features/users/UsersPage.integration.test.tsx` — the elevated operator
  fixture is now an ordinary address with `isSuperAdmin: true`, proving the flag
  alone grants the permission; a further test pins that an ordinary admin sees an
  admin's status locked but the credibility score editable.
- `src/utils/adminAccess.unit.test.ts` — the `isSuperAdminEmail` suite is gone
  with the function; `withRequiredAdminRole` coverage stays.
