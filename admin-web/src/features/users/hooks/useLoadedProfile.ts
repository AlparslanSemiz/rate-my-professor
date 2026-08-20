import { useEffect, useState } from 'react'
import { ApiError } from '../../../api/ApiClient'
import { usersService, type User, type Warning } from '../../../api/UsersService'
import { getErrorMessage } from '../../../utils/getErrorMessage'

const LOAD_ERROR_FALLBACK = 'This profile could not be loaded.'

interface LoadedProfile {
  userId: string
  user: User | null
  warnings: Warning[]
  /** Empty when the account genuinely does not exist, so the two cases stay distinguishable. */
  error: string
}

export function useLoadedProfile(userId: string | null, opened: boolean) {
  const [profile, setProfile] = useState<LoadedProfile | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const isLoadedProfile = profile?.userId === userId
  const user = isLoadedProfile ? profile.user : null
  const warnings = isLoadedProfile ? profile.warnings : []
  const error = isLoadedProfile ? profile.error : ''
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
            error: '',
          })
        }
      } catch (loadError: unknown) {
        // A 404 is the one case where "this account is gone" is the truth. A dropped
        // connection or a 500 is a failure to read the account, and reporting either as
        // "not found" tells the admin something that is not so.
        const notFound = loadError instanceof ApiError && loadError.status === 404
        if (!cancelled) {
          setProfile({
            userId: requestedUserId,
            user: null,
            warnings: [],
            error: notFound ? '' : getErrorMessage(loadError, LOAD_ERROR_FALLBACK),
          })
        }
      }
    }

    void loadProfile()
    return () => {
      cancelled = true
    }
  }, [opened, userId, reloadKey])

  function reset() {
    setProfile(null)
  }

  /** Drops the failed read and re-runs it; the modal stays on the same account. */
  function retry() {
    setProfile(null)
    setReloadKey((key) => key + 1)
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

  return { user, warnings, loading, error, reset, retry, updateUser }
}
