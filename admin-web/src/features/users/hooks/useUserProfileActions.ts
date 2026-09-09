import { useCallback } from 'react'
import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { usersService, type User, type UserUpdate, type Warning } from '@/api/users'
import { getStaleAfterWriteMessage } from '@/utils/getErrorMessage'
import type { LoadedProfile, UserChange } from '../model'

const RE_READ_ERROR_FALLBACK = 'the account could not be read back'

interface ProfileActionOptions {
  userId: string | null
  user: User | null
  profileKey: QueryKey
  onUserChanged?: (id: string, change: UserChange) => void
  onStale: (message: string) => void
}

/**
 * The writes the profile modal can make.
 *
 * Every one of them re-reads what it changed, because the backend owns the result: a status
 * change can alter more than the status, and a warning's count is whatever the list now
 * holds. The re-read is deliberately *not* an invalidation — the modal needs the value in
 * hand to report it back to the list behind it, so it reads and then writes both caches.
 */
export function useUserProfileActions({
  userId,
  user,
  profileKey,
  onUserChanged,
  onStale,
}: ProfileActionOptions) {
  const queryClient = useQueryClient()

  /**
   * A failed read after an accepted write must not make the write look refused. The modal
   * keeps its last reading and says that only the read-back failed.
   */
  const readBack = useCallback(
    async (read: () => Promise<void>) => {
      try {
        await read()
        onStale('')
      } catch (readError: unknown) {
        onStale(getStaleAfterWriteMessage(readError, RE_READ_ERROR_FALLBACK))
      }
    },
    [onStale],
  )

  const refreshWarnings = useCallback(
    async (id: string) => {
      const warnings = await usersService.getWarnings(id)
      queryClient.setQueryData<LoadedProfile>(profileKey, (current) =>
        current?.user ? { user: { ...current.user, warnings: warnings.length }, warnings } : current,
      )
      onUserChanged?.(id, { type: 'warnings-changed', warnings: warnings.length })
    },
    [onUserChanged, profileKey, queryClient],
  )

  const refreshAccount = useCallback(
    async (id: string) => {
      const refreshed = await usersService.getById(id)
      queryClient.setQueryData<LoadedProfile>(profileKey, (current) =>
        current ? { ...current, user: refreshed } : current,
      )
      onUserChanged?.(id, { type: 'refreshed', user: refreshed })
    },
    [onUserChanged, profileKey, queryClient],
  )

  const warnMutation = useMutation({
    mutationFn: async (message: string) => {
      const id = user?.id
      const trimmed = message.trim()
      if (!id || !trimmed) return
      await usersService.warn(id, trimmed)
      await readBack(() => refreshWarnings(id))
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (update: UserUpdate) => {
      const id = user?.id
      if (!id || Object.keys(update).length === 0) return
      await usersService.update(id, update)
      await readBack(() => refreshAccount(id))
    },
  })

  const warningMutation = useMutation({
    mutationFn: async (change: (id: string) => Promise<unknown>) => {
      const id = user?.id
      if (!id) return
      await change(id)
      await readBack(() => refreshWarnings(id))
    },
  })

  const changeStatus = useCallback(
    async (request: (id: string) => Promise<unknown>) => {
      const id = user?.id
      if (!id) return
      await request(id)
      await readBack(() => refreshAccount(id))
    },
    [readBack, refreshAccount, user?.id],
  )

  return {
    warnLoading: warnMutation.isPending,
    editLoading: updateMutation.isPending,
    warningBusy: warningMutation.isPending,
    warn: warnMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    editWarning: (warning: Warning, message: string) =>
      warning.id === null
        ? Promise.resolve()
        : warningMutation.mutateAsync(() =>
            usersService.updateWarning(warning.userID, warning.id as string, message),
          ),
    withdrawWarning: (warning: Warning) =>
      warning.id === null
        ? Promise.resolve()
        : warningMutation.mutateAsync(() =>
            usersService.deleteWarning(warning.userID, warning.id as string),
          ),
    block: () => changeStatus((id) => usersService.block(id)),
    unblock: () => changeStatus((id) => usersService.unblock(id)),
    remove: async () => {
      if (!userId) return
      await usersService.delete(userId)
      onUserChanged?.(userId, { type: 'deleted' })
    },
  }
}
