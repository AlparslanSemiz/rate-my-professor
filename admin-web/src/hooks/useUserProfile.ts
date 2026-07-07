import { useEffect, useState } from 'react'
import { usersService, type User, type Warning } from '../api/UsersService'
import { useAuth } from '../context/useAuth'

export type UserChange = 'warned' | 'blocked' | 'unblocked' | 'deleted'

interface LoadedProfile {
  userId: string
  user: User | null
  warnings: Warning[]
}

function emptyProfile(userId: string): LoadedProfile {
  return { userId, user: null, warnings: [] }
}

export function useUserProfile(
  userId: string | null,
  opened: boolean,
  onUserChanged?: (id: string, change: UserChange) => void
) {
  const { user: currentAdmin } = useAuth()
  const [profile, setProfile] = useState<LoadedProfile | null>(null)
  const [warnLoading, setWarnLoading] = useState(false)

  const isLoadedProfile = profile?.userId === userId
  const user = isLoadedProfile ? profile.user : null
  const warnings = isLoadedProfile ? profile.warnings : []
  const loading = opened && userId !== null && !isLoadedProfile

  useEffect(() => {
    if (!opened || userId === null) return
    const requestedUserId = userId
    let canceled = false

    async function loadProfile() {
      try {
        const [loadedUser, loadedWarnings] = await Promise.all([
          usersService.getById(requestedUserId),
          usersService.getWarnings(requestedUserId),
        ])

        if (canceled) return
        setProfile({ userId: requestedUserId, user: loadedUser ?? null, warnings: loadedWarnings })
      } catch {
        // Surface the "User not found" state instead of an endless spinner.
        if (canceled) return
        setProfile(emptyProfile(requestedUserId))
      }
    }

    void loadProfile()

    return () => {
      canceled = true
    }
  }, [opened, userId])

  function reset() {
    setProfile(null)
  }

  function updateLoadedUser(id: string, update: (user: User) => User, nextWarnings?: Warning[]) {
    setProfile((prev) => {
      if (!prev?.user || prev.user.id !== id) return prev

      return {
        ...prev,
        user: update(prev.user),
        warnings: nextWarnings ?? prev.warnings,
      }
    })
  }

  async function warn(message: string) {
    const trimmedMessage = message.trim()
    if (!user || !trimmedMessage || !currentAdmin) return

    setWarnLoading(true)
    try {
      await usersService.warn(user.id, trimmedMessage, currentAdmin.id)
      const refreshedWarnings = await usersService.getWarnings(user.id)
      updateLoadedUser(user.id, (currentUser) => ({
        ...currentUser,
        warnings: currentUser.warnings + 1,
      }), refreshedWarnings)
      onUserChanged?.(user.id, 'warned')
    } finally {
      setWarnLoading(false)
    }
  }

  async function block() {
    if (!user) return
    await usersService.block(user.id)
    updateLoadedUser(user.id, (currentUser) => ({ ...currentUser, status: 'BLOCKED' }))
    onUserChanged?.(user.id, 'blocked')
  }

  async function unblock() {
    if (!user) return
    await usersService.unblock(user.id)
    updateLoadedUser(user.id, (currentUser) => ({ ...currentUser, status: 'ACTIVE' }))
    onUserChanged?.(user.id, 'unblocked')
  }

  async function remove() {
    if (!user) return
    await usersService.delete(user.id)
    onUserChanged?.(user.id, 'deleted')
  }

  return { user, warnings, loading, warnLoading, reset, warn, block, unblock, remove }
}
