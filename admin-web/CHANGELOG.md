# Changelog

## [Unreleased]

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
