import { useEffect, useState } from 'react'
import { usersService, type User, type Warning } from '../../../api/UsersService'

interface LoadedProfile {
  userId: string
  user: User | null
  warnings: Warning[]
}

function emptyProfile(userId: string): LoadedProfile {
  return { userId, user: null, warnings: [] }
}

export function useLoadedProfile(userId: string | null, opened: boolean) {
  const [profile, setProfile] = useState<LoadedProfile | null>(null)
  const isLoadedProfile = profile?.userId === userId
  const user = isLoadedProfile ? profile.user : null
  const warnings = isLoadedProfile ? profile.warnings : []
  const loading = opened && userId !== null && !isLoadedProfile

  useEffect(() => {
    if (!opened || userId === null) return

    const requestedUserId = userId
    let cancelled = false

    async function loadProfile() {
      try {
        const [loadedUser, loadedWarnings] = await Promise.all([
          usersService.getById(requestedUserId),
          usersService.getWarnings(requestedUserId),
        ])
        if (!cancelled) {
          setProfile({
            userId: requestedUserId,
            user: loadedUser,
            warnings: loadedWarnings,
          })
        }
      } catch {
        if (!cancelled) {
          setProfile(emptyProfile(requestedUserId))
        }
      }
    }

    void loadProfile()
    return () => {
      cancelled = true
    }
  }, [opened, userId])

  function reset() {
    setProfile(null)
  }

  function updateUser(id: string, update: (user: User) => User, nextWarnings?: Warning[]) {
    setProfile((current) => {
      if (!current?.user || current.user.id !== id) return current
      return {
        ...current,
        user: update(current.user),
        warnings: nextWarnings ?? current.warnings,
      }
    })
  }

  return { user, warnings, loading, reset, updateUser }
}
