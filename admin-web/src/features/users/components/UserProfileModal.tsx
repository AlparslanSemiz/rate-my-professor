import { useState } from 'react'
import { Center, Loader, Modal, Text } from '@mantine/core'
import type { Warning } from '../../../api/UsersService'
import ConfirmModal from '../../../components/ConfirmModal'
import ErrorAlert from '../../../components/ErrorAlert'
import LoadError from '../../../components/LoadError'
import { darkModalStyles } from '../../../constants/modalStyles'
import { useAuth } from '../../../context/useAuth'
import { useUserProfile, type UserChange } from '../hooks/useUserProfile'
import { getUserAccess } from '../userAccess'
import { getUserConfirmation, type ConfirmAction } from '../userConfirmation'
import ProfileActions from './ProfileActions'
import ProfileSummary from './ProfileSummary'
import UserEditForm from './UserEditForm'
import WarnForm from './WarnForm'
import WarningHistory from './WarningHistory'

interface UserProfileModalProps {
  userId: string | null
  opened: boolean
  onClose: () => void
  /** Carries what the backend now reports, so a list row can be replaced rather than guessed at. */
  onUserChanged?: (id: string, change: UserChange) => void
}

export default function UserProfileModal({
  userId,
  opened,
  onClose,
  onUserChanged,
}: UserProfileModalProps) {
  const { user: currentAdmin } = useAuth()
  const profile = useUserProfile(userId, opened, onUserChanged)
  const [showWarnForm, setShowWarnForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [withdrawing, setWithdrawing] = useState<Warning | null>(null)

  function handleClose() {
    profile.reset()
    setShowWarnForm(false)
    setShowEditForm(false)
    setConfirmAction(null)
    setWithdrawing(null)
    onClose()
  }

  async function handleDelete() {
    await profile.remove()
    handleClose()
  }

  async function handleWarning(message: string) {
    await profile.warn(message)
    setShowWarnForm(false)
  }

  const confirmConfig =
    profile.user && confirmAction
      ? getUserConfirmation(confirmAction, profile.user, {
          block: profile.block,
          unblock: profile.unblock,
          delete: handleDelete,
        })
      : null

  return (
    <>
      <Modal
        opened={opened}
        onClose={handleClose}
        title="User Profile"
        centered
        size="lg"
        styles={darkModalStyles}
      >
        {profile.loading ? (
          <Center h={160}>
            <Loader color="green" size="sm" />
          </Center>
        ) : profile.error ? (
          <LoadError message={profile.error} onRetry={profile.retry} />
        ) : !profile.user ? (
          <Center h={120}>
            <Text c="#4b5563" size="sm">
              User not found.
            </Text>
          </Center>
        ) : (
          <>
            {/* The action happened; only the read after it did not. */}
            <ErrorAlert message={profile.staleMessage} />
            <ProfileSummary user={profile.user} />
            <ProfileActions
              user={profile.user}
              access={getUserAccess(profile.user, currentAdmin)}
              onToggleEdit={() => setShowEditForm((visible) => !visible)}
              onToggleWarning={() => setShowWarnForm((visible) => !visible)}
              onConfirm={setConfirmAction}
            />
            {showEditForm && (
              <UserEditForm
                key={profile.user.id}
                user={profile.user}
                access={getUserAccess(profile.user, currentAdmin)}
                loading={profile.editLoading}
                onCancel={() => setShowEditForm(false)}
                onSubmit={async (update) => {
                  await profile.update(update)
                  setShowEditForm(false)
                }}
              />
            )}
            {showWarnForm && (
              <WarnForm
                userName={profile.user.username}
                loading={profile.warnLoading}
                onCancel={() => setShowWarnForm(false)}
                onSubmit={handleWarning}
              />
            )}
            <WarningHistory
              warnings={profile.warnings}
              busy={profile.warningBusy}
              onEdit={profile.editWarning}
              onWithdraw={setWithdrawing}
            />
          </>
        )}
      </Modal>

      {confirmConfig && (
        <ConfirmModal opened onClose={() => setConfirmAction(null)} {...confirmConfig} />
      )}

      {withdrawing && (
        <ConfirmModal
          opened
          title="Withdraw warning"
          description="Withdraw this warning? The student is not notified — the notification went out when it was issued."
          confirmLabel="Withdraw warning"
          confirmColor="red"
          onConfirm={() => profile.withdrawWarning(withdrawing)}
          onClose={() => setWithdrawing(null)}
        />
      )}
    </>
  )
}
