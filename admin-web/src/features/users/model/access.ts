import type { User } from '@/api/users'

interface UserOperator {
  id: string
  isSuperAdmin?: boolean
}

/**
 * What the signed-in operator may do to one account.
 *
 * Five flags rather than one, because they are not the same rule and the differences are
 * deliberate. `canModerate` and `canEditStatus` are the same expression — warning, blocking,
 * unblocking, deleting and setting the status all sit behind one backend guard — while
 * `canEditRole` and `canEditCredibilityScore` are not, because those are ordinary field edits
 * that any admin may make on any account **but their own**.
 *
 * The one rule running through all of them is self protection: nobody moderates, blocks,
 * deletes or re-roles their own account. It is intentional and it stays — the risk on the
 * other side is locking the last operator out of the panel.
 *
 * A gate on what the panel *offers*. The backend authorises every request independently.
 */
export interface UserAccess {
  isSelf: boolean
  canModerate: boolean
  canEditStatus: boolean
  canEditRole: boolean
  canEditCredibilityScore: boolean
}

/**
 * Works out what the operator may do to this account.
 *
 * An ordinary admin may not act on another admin; an elevated operator may. That privilege is
 * read from `isSuperAdmin` and is a behaviour, not a role — see ADR 0004 — so nothing here
 * changes what is *rendered* as the account's role.
 *
 * @param user the account being looked at
 * @param operator the signed-in admin; absent means no session, and nothing is permitted
 * @returns the five permissions, all false-by-default when there is no operator
 */
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
