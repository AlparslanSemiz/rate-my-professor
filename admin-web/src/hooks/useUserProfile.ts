import { useEffect, useState } from 'react'
import { usersService, type User, type Warning } from '../api/UsersService'

export type UserChange = 'warned' | 'blocked' | 'unblocked' | 'deleted'

interface LoadedProfile {
  userId: number
  user: User | null
  warnings: Warning[]
}

export function useUserProfile(
  userId: number | null,
  opened: boolean,
  onUserChanged?: (id: number, change: UserChange) => void
) {
  const [profile, setProfile] = useState<LoadedProfile | null>(null)
  const [warnLoading, setWarnLoading] = useState(false)

  const isLoadedProfile = profile?.userId === userId
  const user = isLoadedProfile ? profile.user : null
  const warnings = isLoadedProfile ? profile.warnings : []
  const loading = opened && userId !== null && !isLoadedProfile

  useEffect(() => {
    if (!opened || userId === null) return
    let canceled = false

    Promise.all([usersService.getById(userId), usersService.getWarnings(userId)]).then(([u, w]) => {
      if (canceled) return
      setProfile({ userId, user: u ?? null, warnings: w })
    })

    return () => {
      canceled = true
    }
  }, [opened, userId])

  function reset() {
    setProfile(null)
  }

  async function warn(message: string) {
    if (!user || !message.trim()) return
    setWarnLoading(true)
    const newWarning = await usersService.warn(user.id, message.trim())
    setProfile((prev) => prev && prev.user?.id === user.id ? {
      ...prev,
      user: { ...prev.user, warningCount: prev.user.warningCount + 1 },
      warnings: [newWarning, ...prev.warnings],
    } : prev)
    setWarnLoading(false)
    onUserChanged?.(user.id, 'warned')
  }

  async function block() {
    if (!user) return
    await usersService.block(user.id)
    setProfile((prev) => prev && prev.user?.id === user.id ? {
      ...prev,
      user: { ...prev.user, status: 'Blocked' },
    } : prev)
    onUserChanged?.(user.id, 'blocked')
  }

  async function unblock() {
    if (!user) return
    await usersService.unblock(user.id)
    setProfile((prev) => prev && prev.user?.id === user.id ? {
      ...prev,
      user: { ...prev.user, status: 'Active' },
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
