import { useEffect, useState } from 'react'
import { usersService, type User, type Warning } from '../api/UsersService'
import { useAuth } from '../context/useAuth'

export type UserChange = 'warned' | 'blocked' | 'unblocked' | 'deleted'

interface LoadedProfile {
  userId: string
  user: User | null
  warnings: Warning[]
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
    let canceled = false

    Promise.all([usersService.getById(userId), usersService.getWarnings(userId)])
      .then(([u, w]) => {
        if (canceled) return
        setProfile({ userId, user: u ?? null, warnings: w })
      })
      .catch(() => {
        // Surface the "User not found" state instead of an endless spinner.
        if (canceled) return
        setProfile({ userId, user: null, warnings: [] })
      })

    return () => {
      canceled = true
    }
  }, [opened, userId])

  function reset() {
    setProfile(null)
  }

  async function warn(message: string) {
    if (!user || !message.trim() || !currentAdmin) return
    setWarnLoading(true)
    await usersService.warn(user.id, message.trim(), currentAdmin.id)
    const refreshedWarnings = await usersService.getWarnings(user.id)
    setProfile((prev) => prev && prev.user?.id === user.id ? {
      ...prev,
      user: { ...prev.user, warnings: prev.user.warnings + 1 },
      warnings: refreshedWarnings,
    } : prev)
    setWarnLoading(false)
    onUserChanged?.(user.id, 'warned')
  }

  async function block() {
    if (!user) return
    await usersService.block(user.id)
    setProfile((prev) => prev && prev.user?.id === user.id ? {
      ...prev,
      user: { ...prev.user, status: 'BLOCKED' },
    } : prev)
    onUserChanged?.(user.id, 'blocked')
  }

  async function unblock() {
    if (!user) return
    await usersService.unblock(user.id)
    setProfile((prev) => prev && prev.user?.id === user.id ? {
      ...prev,
      user: { ...prev.user, status: 'ACTIVE' },
    } : prev)
    onUserChanged?.(user.id, 'unblocked')
  }

  async function remove() {
    if (!user) return
    await usersService.delete(user.id)
    onUserChanged?.(user.id, 'deleted')
  }

  return { user, warnings, loading, warnLoading, reset, warn, block, unblock, remove }
}
