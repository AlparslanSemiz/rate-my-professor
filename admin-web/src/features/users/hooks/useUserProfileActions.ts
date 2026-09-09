import { useState } from 'react'
import { usersService, type User, type UserUpdate, type Warning } from '../../../api/UsersService'
import { getStaleAfterWriteMessage } from '../../../utils/getErrorMessage'
import type { UserChange } from './userProfileTypes'

const RE_READ_ERROR_FALLBACK = 'the account could not be read back'

interface UserProfileActionTarget {
  user: User | null
  updateUser: (id: string, update: (user: User) => User, nextWarnings?: Warning[]) => void
}

export function useUserProfileActions(
  profile: UserProfileActionTarget,
  onUserChanged?: (id: string, change: UserChange) => void,
) {
  const [warnLoading, setWarnLoading] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [warningBusy, setWarningBusy] = useState(false)
  const [staleMessage, setStaleMessage] = useState('')

  /**
   * A failed read after an accepted write must not make the write look refused. The modal keeps
   * its last reading and tells the operator that only the read-back failed.
   */
  async function readBack(read: () => Promise<void>) {
    try {
      await read()
      setStaleMessage('')
    } catch (readError: unknown) {
      setStaleMessage(getStaleAfterWriteMessage(readError, RE_READ_ERROR_FALLBACK))
    }
  }

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
    if (!profile.user || !trimmedMessage) return

    const id = profile.user.id
    setWarnLoading(true)
    try {
      await usersService.warn(id, trimmedMessage)
      await readBack(async () => applyWarnings(id, await usersService.getWarnings(id)))
    } finally {
      setWarnLoading(false)
    }
  }

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

  return {
    staleMessage,
    reset: () => setStaleMessage(''),
    warnLoading,
    editLoading,
    warningBusy,
    warn,
    update,
    editWarning,
    withdrawWarning,
    block: () => changeStatus((id) => usersService.block(id)),
    unblock: () => changeStatus((id) => usersService.unblock(id)),
    remove,
  }
}
