import { useCallback, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ApiError } from '@/api/client'
import { usersService, type User, type Warning } from '@/api/users'
import { getErrorMessage } from '@/utils/getErrorMessage'
import type { UserChange } from '../model'
import { useUserProfileActions } from './useUserProfileActions'

const LOAD_ERROR_FALLBACK = 'This profile could not be loaded.'

export interface LoadedProfile {
  user: User | null
  warnings: Warning[]
}

const userProfileKeys = {
  all: ['user-profile'] as const,
  detail: (id: string) => [...userProfileKeys.all, id] as const,
}

/**
 * One account as the profile modal needs it: the record and its warnings, read together.
 *
 * A `404` is the one case where "this account is gone" is the truth, so it resolves to an
 * empty profile rather than raising. A dropped connection or a `500` is a failure to *read*
 * the account, and reporting either as "not found" would tell the operator something untrue.
 */
async function fetchProfile(userId: string): Promise<LoadedProfile> {
  try {
    const [user, warnings] = await Promise.all([
      usersService.getById(userId),
      usersService.getWarnings(userId),
    ])
    return { user, warnings }
  } catch (error: unknown) {
    if (error instanceof ApiError && error.status === 404) return { user: null, warnings: [] }
    throw error
  }
}

export function useUserProfile(
  userId: string | null,
  opened: boolean,
  onUserChanged?: (id: string, change: UserChange) => void,
) {
  const [staleMessage, setStaleMessage] = useState('')

  const profile = useQuery({
    queryKey: userProfileKeys.detail(userId ?? ''),
    queryFn: () => fetchProfile(userId as string),
    // The modal is closed most of the time, and a closed modal has no account to read.
    enabled: opened && userId !== null,
  })

  const actions = useUserProfileActions({
    userId,
    user: profile.data?.user ?? null,
    profileKey: userProfileKeys.detail(userId ?? ''),
    onUserChanged,
    onStale: setStaleMessage,
  })

  const reset = useCallback(() => {
    setStaleMessage('')
  }, [])

  return {
    user: profile.data?.user ?? null,
    warnings: profile.data?.warnings ?? [],
    loading: profile.isPending && opened && userId !== null,
    error: profile.error ? getErrorMessage(profile.error, LOAD_ERROR_FALLBACK) : '',
    /** Set when a write succeeded but the read after it did not; the action still happened. */
    staleMessage,
    retry: () => {
      void profile.refetch()
    },
    reset,
    ...actions,
  }
}
