import type { User, UserRole, UserStatus, UserUpdate } from '../../api/UsersService'
import type { UserAccess } from './userAccess'

export type EditableUserStatus = Extract<UserStatus, 'ACTIVE' | 'BLOCKED'>

export interface UserEditDraft {
  username: string
  biography: string
  status: EditableUserStatus
  role: UserRole
  credibilityScore: number | null
}

const EDITABLE_STATUSES: EditableUserStatus[] = ['ACTIVE', 'BLOCKED']
const ROLES: UserRole[] = ['STUDENT', 'ADMIN']

export const USER_STATUS_EDIT_OPTIONS: { value: EditableUserStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'BLOCKED', label: 'Blocked' },
]

export const USER_ROLE_EDIT_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'STUDENT', label: 'Student' },
  { value: 'ADMIN', label: 'Admin' },
]

export function createUserEditDraft(user: User): UserEditDraft {
  return {
    username: user.username,
    biography: user.biography,
    status: user.status === 'BLOCKED' ? 'BLOCKED' : 'ACTIVE',
    role: user.role,
    credibilityScore: user.credibilityScore,
  }
}

export function isEditableUserStatus(value: string | null): value is EditableUserStatus {
  return EDITABLE_STATUSES.some((status) => status === value)
}

export function isUserRole(value: string | null): value is UserRole {
  return ROLES.some((role) => role === value)
}

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

export function canSaveUserEdit(user: User, draft: UserEditDraft, access: UserAccess) {
  return draft.username.trim().length > 0 && Object.keys(buildUserUpdate(user, draft, access)).length > 0
}
