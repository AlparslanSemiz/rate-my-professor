import { useState } from 'react'
import { usersService, type User, type UserUpdate, type Warning } from '../../../api/UsersService'
import { useAuth } from '../../../context/useAuth'
import { useLoadedProfile } from './useLoadedProfile'

export type UserChange = 'warned' | 'blocked' | 'unblocked' | 'deleted' | 'updated'
type ModerationStatus = Extract<User['status'], 'ACTIVE' | 'BLOCKED'>

export function useUserProfile(
  userId: string | null,
  opened: boolean,
  onUserChanged?: (id: string, change: UserChange, user?: User) => void,
) {
  const { user: currentAdmin } = useAuth()
  const profile = useLoadedProfile(userId, opened)
  const [warnLoading, setWarnLoading] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [warningBusy, setWarningBusy] = useState(false)

  async function warn(message: string) {
    const trimmedMessage = message.trim()
    if (!profile.user || !trimmedMessage || !currentAdmin) return

    setWarnLoading(true)
    try {
      await usersService.warn(profile.user.id, trimmedMessage, currentAdmin.id)
      const refreshedWarnings = await usersService.getWarnings(profile.user.id)
      profile.updateUser(
        profile.user.id,
        (currentUser) => ({ ...currentUser, warnings: currentUser.warnings + 1 }),
        refreshedWarnings,
      )
      onUserChanged?.(profile.user.id, 'warned')
    } finally {
      setWarnLoading(false)
    }
  }

  /**
   * Applies a partial edit and re-reads the account rather than patching it locally: the
   * backend trims and lowercases the email, and a role change moves the account between tables.
   */
  async function update(nextUpdate: UserUpdate) {
    if (!profile.user || Object.keys(nextUpdate).length === 0) return

    const id = profile.user.id
    setEditLoading(true)
    try {
      await usersService.update(id, nextUpdate)
      const refreshed = await usersService.getById(id)
      profile.updateUser(id, () => refreshed)
      onUserChanged?.(id, 'updated', refreshed)
    } finally {
      setEditLoading(false)
    }
  }

  /** Re-reads the history so the count and the list stay in step with what the backend kept. */
  async function runWarningChange(change: () => Promise<unknown>) {
    if (!profile.user) return

    const id = profile.user.id
    setWarningBusy(true)
    try {
      await change()
      const refreshedWarnings = await usersService.getWarnings(id)
      profile.updateUser(
        id,
        (currentUser) => ({ ...currentUser, warnings: refreshedWarnings.length }),
        refreshedWarnings,
      )
      onUserChanged?.(id, 'warned')
    } finally {
      setWarningBusy(false)
    }
  }

  async function editWarning(warning: Warning, message: string) {
    const warningId = warning.id
    if (warningId === null) return
    await runWarningChange(() => usersService.updateWarning(warning.userID, warningId, message))
  }

  async function withdrawWarning(warning: Warning) {
    const warningId = warning.id
    if (warningId === null) return
    await runWarningChange(() => usersService.deleteWarning(warning.userID, warningId))
  }

  async function changeStatus(
    request: (id: string) => Promise<unknown>,
    status: ModerationStatus,
    change: Extract<UserChange, 'blocked' | 'unblocked'>,
  ) {
    if (!profile.user) return

    const id = profile.user.id
    await request(id)
    profile.updateUser(id, (currentUser) => ({ ...currentUser, status }))
    onUserChanged?.(id, change)
  }

  async function remove() {
    if (!profile.user) return
    await usersService.delete(profile.user.id)
    onUserChanged?.(profile.user.id, 'deleted')
  }

  return {
    user: profile.user,
    warnings: profile.warnings,
    loading: profile.loading,
    error: profile.error,
    retry: profile.retry,
    warnLoading,
    editLoading,
    warningBusy,
    reset: profile.reset,
    warn,
    update,
    editWarning,
    withdrawWarning,
    block: () => changeStatus((id) => usersService.block(id), 'BLOCKED', 'blocked'),
    unblock: () => changeStatus((id) => usersService.unblock(id), 'ACTIVE', 'unblocked'),
    remove,
  }
}
