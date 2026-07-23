import { useState } from 'react'
import { usersService, type User } from '../../../api/UsersService'
import { useAuth } from '../../../context/useAuth'
import { useLoadedProfile } from './useLoadedProfile'

export type UserChange = 'warned' | 'blocked' | 'unblocked' | 'deleted'
type ModerationStatus = Extract<User['status'], 'ACTIVE' | 'BLOCKED'>

export function useUserProfile(
  userId: string | null,
  opened: boolean,
  onUserChanged?: (id: string, change: UserChange) => void,
) {
  const { user: currentAdmin } = useAuth()
  const profile = useLoadedProfile(userId, opened)
  const [warnLoading, setWarnLoading] = useState(false)

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
    warnLoading,
    reset: profile.reset,
    warn,
    block: () => changeStatus((id) => usersService.block(id), 'BLOCKED', 'blocked'),
    unblock: () => changeStatus((id) => usersService.unblock(id), 'ACTIVE', 'unblocked'),
    remove,
  }
}
