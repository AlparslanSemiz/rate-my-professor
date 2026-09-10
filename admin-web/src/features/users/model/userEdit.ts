import type { User, UserRole, UserStatus, UserUpdate } from '@/api/users'
import type { UserAccess } from './access'

/**
 * The two statuses the edit form offers. `INACTIVE` is the backend's own and `DELETED` is
 * what `DELETE /users/{id}` produces, so neither is something a form can set.
 */
export type EditableUserStatus = Extract<UserStatus, 'ACTIVE' | 'BLOCKED'>

/** The edit form's working copy of an account, before anything is sent. */
export interface UserEditDraft {
  username: string
  biography: string
  status: EditableUserStatus
  role: UserRole
  credibilityScore: number | null
}

const EDITABLE_STATUSES: EditableUserStatus[] = ['ACTIVE', 'BLOCKED']
const ROLES: UserRole[] = ['STUDENT', 'ADMIN']

/** The status dropdown's options. */
export const USER_STATUS_EDIT_OPTIONS: { value: EditableUserStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'BLOCKED', label: 'Blocked' },
]

/** The role dropdown's options. Two, because there is no third role — see ADR 0004. */
export const USER_ROLE_EDIT_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'STUDENT', label: 'Student' },
  { value: 'ADMIN', label: 'Admin' },
]

/**
 * Opens the edit form on an account.
 *
 * A status the form cannot represent — `INACTIVE`, or a deleted account — is shown as
 * `ACTIVE`, so the dropdown holds something rather than nothing. Saving without touching it
 * sends no status at all, because `buildUserUpdate` diffs against the account rather than
 * against the draft's default.
 *
 * @param user the account to edit
 * @returns the draft the form works on
 */
export function createUserEditDraft(user: User): UserEditDraft {
  return {
    username: user.username,
    biography: user.biography,
    status: user.status === 'BLOCKED' ? 'BLOCKED' : 'ACTIVE',
    role: user.role,
    credibilityScore: user.credibilityScore,
  }
}

/** @returns whether the value is a status the form may set. */
export function isEditableUserStatus(value: string | null): value is EditableUserStatus {
  return EDITABLE_STATUSES.some((status) => status === value)
}

/** @returns whether the value is a role this panel knows. */
export function isUserRole(value: string | null): value is UserRole {
  return ROLES.some((role) => role === value)
}

/**
 * The fields that actually changed, and that this operator is allowed to change.
 *
 * Two filters, not one. Diffing against the account keeps the request minimal — an empty body
 * is refused, and sending a field back unchanged would still write an audit entry saying it
 * was edited. Checking `access` keeps a control the panel disabled from being sent anyway.
 *
 * @param user the account as it stands
 * @param draft the form's working copy
 * @param access what this operator may change
 * @returns only the changed, permitted fields; possibly empty
 */
export function buildUserUpdate(user: User, draft: UserEditDraft, access: UserAccess): UserUpdate {
  const trimmedUsername = draft.username.trim()
  const update: UserUpdate = {}

  if (trimmedUsername !== user.username) update.username = trimmedUsername
  if (draft.biography !== user.biography) update.biography = draft.biography
  if (access.canEditStatus && draft.status !== user.status) update.status = draft.status
  if (access.canEditRole && draft.role !== user.role) update.role = draft.role
  if (
    access.canEditCredibilityScore &&
    draft.credibilityScore !== null &&
    draft.credibilityScore !== user.credibilityScore
  ) {
    update.credibilityScore = draft.credibilityScore
  }

  return update
}

/**
 * @returns whether Save should be offered: something changed, and the username is not blank
 */
export function canSaveUserEdit(user: User, draft: UserEditDraft, access: UserAccess) {
  return draft.username.trim().length > 0 && Object.keys(buildUserUpdate(user, draft, access)).length > 0
}
