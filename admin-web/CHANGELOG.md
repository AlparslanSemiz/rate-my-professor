# Changelog

## [Unreleased]

### Added — elevated permissions for `u-kisi4@student.kit.edu`

`u-kisi4@student.kit.edu` may now act on **admin** accounts from the user profile,
not only on students. Nothing about this is visible: the account is still
reported and rendered as `ADMIN` everywhere in the panel — no new role, no
badge, no label change.

**`src/utils/adminAccess.ts`**
- Added `SUPER_ADMIN_EMAILS`, a second and narrower set next to the existing
  `REQUIRED_ADMIN_EMAILS`, holding only `u-kisi4@student.kit.edu`.
- Added `isSuperAdminEmail(email)`, which normalizes the address the same way
  `isRequiredAdminEmail` does (trim + lowercase).
- `withRequiredAdminRole` is **unchanged**: the address is still reported as
  `'ADMIN'`, so `UserRole`, `roleColor` / `roleAccent`, `USER_ROLE_FILTERS`,
  `UserChip` and the audit-log rows were not touched.

**`src/features/users/components/UserProfileModal.tsx`**
- Derives `canActOnAdmins` from the signed-in operator's address — the one place
  that already made an authorization decision from `useAuth()` — and passes it to
  `ProfileActions` and `UserEditForm`.

**`src/features/users/components/ProfileActions.tsx`**
- New `canActOnAdmins` prop. `isProtected` became
  `isSelf || (user.role === 'ADMIN' && !canActOnAdmins)`, so Warn / Block /
  Unblock / Delete account are offered on admin accounts to an elevated operator.

**`src/features/users/components/UserEditForm.tsx`**
- New `canActOnAdmins` prop. `accessLocked` became
  `isSelf || (user.role === 'ADMIN' && !canActOnAdmins)`, unlocking Status and
  Credibility score on admin accounts for an elevated operator.
- The status field now reads `accessLocked` instead of repeating the same
  condition inline — identical behaviour, one source of truth.

### Unchanged on purpose

- **Self protection stays.** No one can change their own role, block or delete
  themselves, elevated or not.
- **The role label stays `ADMIN`.** No `SUPERADMIN` value entered `UserRole`,
  the role dropdown still offers Student / Admin only, and the sidebar, header,
  user table and audit log render exactly what they rendered before.
- **KIT email stays read-only** for everyone.
- No route or navigation gating changed; `ProtectedRoute` is still
  authentication-only.

### Tests

- New `src/utils/adminAccess.unit.test.ts` — the address is recognised, casing
  and whitespace are normalized, the other five admins are not elevated, and
  `withRequiredAdminRole` still reports the elevated address as `ADMIN`.
- `src/features/users/UsersPage.integration.test.tsx` — `renderUsers()` takes an
  optional session user; a new block covers the elevated operator seeing the
  moderation buttons and the unlocked fields on another admin, and still being
  blocked on their own account. Every pre-existing test passes unmodified, since
  the fixture operator (`admin@student.kit.edu`) is not elevated.

### Known limitation

Frontend only. The backend lives in a separate repository and still answers
`409` / `403` for these actions on admin accounts, so an elevated operator sees
the buttons but the request fails until the backend grants the same permission.
See `backendtasks.md`.
