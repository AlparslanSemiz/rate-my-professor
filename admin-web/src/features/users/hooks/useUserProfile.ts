import { useState } from 'react'
import { usersService, type User, type UserUpdate, type Warning } from '../../../api/UsersService'
import { useAuth } from '../../../context/useAuth'
import { getStaleAfterWriteMessage } from '../../../utils/getErrorMessage'
import { useLoadedProfile } from './useLoadedProfile'

/**
 * What a profile action changed, carrying the value the backend reported rather than leaving
 * the list to guess at it: an edit, a block and an unblock all report the re-read account, and
 * a warning change reports the length of the re-read history.
 */
export type UserChange =
  | { type: 'refreshed'; user: User }
  | { type: 'warnings-changed'; warnings: number }
  | { type: 'deleted' }

const RE_READ_ERROR_FALLBACK = 'the account could not be read back'

export function useUserProfile(
  userId: string | null,
  opened: boolean,
  onUserChanged?: (id: string, change: UserChange) => void,
) {
  const { user: currentAdmin } = useAuth()
  const profile = useLoadedProfile(userId, opened)
  const [warnLoading, setWarnLoading] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [warningBusy, setWarningBusy] = useState(false)
  const [staleMessage, setStaleMessage] = useState('')

  /**
   * Re-reads what the backend now holds after a write it already accepted.
   *
   * A failed read does **not** fail the action: the write succeeded, and reporting it as
   * refused would tell the operator nothing was saved. The screen keeps the last reading and
   * says so, and `onUserChanged` stays silent — a list row may only be replaced by a value
   * the backend actually reported.
   */
  async function readBack(read: () => Promise<void>) {
    try {
      await read()
      setStaleMessage('')
    } catch (readError: unknown) {
      setStaleMessage(getStaleAfterWriteMessage(readError, RE_READ_ERROR_FALLBACK))
    }
  }

  /** Reports the history the backend now holds, so neither the modal nor the list counts by hand. */
  function applyWarnings(id: string, refreshedWarnings: Warning[]) {
    profile.updateUser(
      id,
      (currentUser) => ({ ...currentUser, warnings: refreshedWarnings.length }),
      refreshedWarnings,
    )
    onUserChanged?.(id, { type: 'warnings-changed', warnings: refreshedWarnings.length })
  }

  function applyAccount(id: string, refreshed: User) {
    profile.updateUser(id, () => refreshed)
    onUserChanged?.(id, { type: 'refreshed', user: refreshed })
  }

  async function warn(message: string) {
    const trimmedMessage = message.trim()
    if (!profile.user || !trimmedMessage || !currentAdmin) return

    const id = profile.user.id
    setWarnLoading(true)
    try {
      await usersService.warn(id, trimmedMessage, currentAdmin.id)
      await readBack(async () => applyWarnings(id, await usersService.getWarnings(id)))
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
      await readBack(async () => applyAccount(id, await usersService.getById(id)))
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
      await readBack(async () => applyWarnings(id, await usersService.getWarnings(id)))
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

  /** Re-reads the account for the same reason `update` does: the backend decides the result. */
  async function changeStatus(request: (id: string) => Promise<unknown>) {
    if (!profile.user) return

    const id = profile.user.id
    await request(id)
    await readBack(async () => applyAccount(id, await usersService.getById(id)))
  }

  async function remove() {
    if (!profile.user) return
    await usersService.delete(profile.user.id)
    onUserChanged?.(profile.user.id, { type: 'deleted' })
  }

  function reset() {
    setStaleMessage('')
    profile.reset()
  }

  return {
    user: profile.user,
    warnings: profile.warnings,
    loading: profile.loading,
    error: profile.error,
    /** Set when a write succeeded but the read after it did not; the action still happened. */
    staleMessage,
    retry: profile.retry,
    warnLoading,
    editLoading,
    warningBusy,
    reset,
    warn,
    update,
    editWarning,
    withdrawWarning,
    block: () => changeStatus((id) => usersService.block(id)),
    unblock: () => changeStatus((id) => usersService.unblock(id)),
    remove,
  }
}
