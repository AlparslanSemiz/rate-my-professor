# Tasks

Open work around the elevated permissions given to `u-kisi4@student.kit.edu`
(what already shipped is in `CHANGELOG.md`).

## Blocking

- [ ] **Verify end to end.** The backend counterpart is deployed
      (`ADMIN_SUPERUSER_EMAILS`, reported as `isSuperAdmin` on `/auth/me`), and
      the panel now reads it. Sign in as `u-kisi4@student.kit.edu`, warn / block /
      unblock a real admin account, edit its status and credibility score, and
      confirm the audit log records the action with the right actor. Confirm too
      that the session survives a reload — the `/auth/me` field names were wrong
      until now, which signed the operator out on every load.

## Follow-up

- [ ] **Decide what happens to self protection.** It is deliberately kept: no one
      changes their own role or status, blocks or deletes themselves. Revisit
      only if there is a real need — the risk is locking the last operator out of
      the panel.
- [ ] **Consider surfacing `metadata.elevated` in the audit log.** The backend
      marks entries only an elevated operator could have written. Ignoring it is
      fine and is what the panel does today; it would be the first visible
      difference between an elevated operator and any other admin, so it needs a
      deliberate decision rather than being added because it is available.

## Done

- [x] **Backend counterpart.** Shipped on `elevated-admin-operator`.
- [x] **Read the permission from the backend instead of a hardcoded list.**
      `SUPER_ADMIN_EMAILS` and `isSuperAdminEmail` are gone; the panel reads
      `isSuperAdmin` from `/auth/me`, validated in `authSessionStorage.isAuthUser`.
      There is no longer a second list to keep in sync — only
      `REQUIRED_ADMIN_EMAILS` (who is offered a login code) and the backend's
      `ADMIN_BOOTSTRAP_EMAILS` still move together, as they always did.
- [x] **Document the tier in the README.** "Who may sign in" now describes it.

## Non-goals

- No `SUPERADMIN` value in `UserRole`, no badge, no visual difference anywhere.
  The permission is behavioural only; the panel keeps showing `ADMIN`.
- No role-based route or navigation gating. `ProtectedRoute` stays
  authentication-only.
