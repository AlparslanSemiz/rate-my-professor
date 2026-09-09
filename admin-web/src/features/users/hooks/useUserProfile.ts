import { useLoadedProfile } from './useLoadedProfile'
import { useUserProfileActions } from './useUserProfileActions'
import type { UserChange } from './userProfileTypes'

export type { UserChange } from './userProfileTypes'

export function useUserProfile(
  userId: string | null,
  opened: boolean,
  onUserChanged?: (id: string, change: UserChange) => void,
) {
  const profile = useLoadedProfile(userId, opened)
  const actions = useUserProfileActions(profile, onUserChanged)

  function reset() {
    actions.reset()
    profile.reset()
  }

  return {
    user: profile.user,
    warnings: profile.warnings,
    loading: profile.loading,
    error: profile.error,
    /** Set when a write succeeded but the read after it did not; the action still happened. */
    staleMessage: actions.staleMessage,
    retry: profile.retry,
    warnLoading: actions.warnLoading,
    editLoading: actions.editLoading,
    warningBusy: actions.warningBusy,
    reset,
    warn: actions.warn,
    update: actions.update,
    editWarning: actions.editWarning,
    withdrawWarning: actions.withdrawWarning,
    block: actions.block,
    unblock: actions.unblock,
    remove: actions.remove,
  }
}
