import type { User } from '@/api/users'

interface UserOperator {
  id: string
  isSuperAdmin?: boolean
}

export interface UserAccess {
  isSelf: boolean
  canModerate: boolean
  canEditStatus: boolean
  canEditRole: boolean
  canEditCredibilityScore: boolean
}

export function getUserAccess(user: User, operator: UserOperator | null | undefined): UserAccess {
  const isSelf = user.id === operator?.id
  const canActOnAdmin = user.role !== 'ADMIN' || operator?.isSuperAdmin === true

  return {
    isSelf,
    // Warning, blocking, unblocking and deleting follow the same backend guard.
    canModerate: !isSelf && canActOnAdmin,
    canEditStatus: !isSelf && canActOnAdmin,
    canEditRole: !isSelf,
    canEditCredibilityScore: !isSelf,
  }
}
