import { useState } from 'react'
import { Center, Loader, Modal, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import type { Warning } from '@/api/users'
import ConfirmModal from '@/components/ConfirmModal'
import ErrorAlert from '@/components/ErrorAlert'
import LoadError from '@/components/LoadError'
import { useAuth } from '@/context/useAuth'
import { useUserProfile } from '../hooks/useUserProfile'
import {
  getUserAccess,
  getUserConfirmation,
  type ConfirmAction,
  type UserChange,
} from '../model'
import ProfileActions from './ProfileActions'
import ProfileSummary from './ProfileSummary'
import UserEditForm from './UserEditForm'
import WarnForm from './WarnForm'
import WarningHistory from './WarningHistory'
import { chrome } from '@/theme'

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
  const [warnFormOpen, warnForm] = useDisclosure(false)
  const [editFormOpen, editForm] = useDisclosure(false)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [withdrawing, setWithdrawing] = useState<Warning | null>(null)

  function handleClose() {
    profile.reset()
    warnForm.close()
    editForm.close()
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
    warnForm.close()
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
      >
        {profile.loading ? (
          <Center h={160}>
            <Loader color="green" size="sm" />
          </Center>
        ) : profile.error ? (
          <LoadError message={profile.error} onRetry={profile.retry} />
        ) : !profile.user ? (
          <Center h={120}>
            <Text c={chrome.textFaint} size="sm">
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
              onToggleEdit={editForm.toggle}
              onToggleWarning={warnForm.toggle}
              onConfirm={setConfirmAction}
            />
            {editFormOpen && (
              <UserEditForm
                key={profile.user.id}
                user={profile.user}
                access={getUserAccess(profile.user, currentAdmin)}
                loading={profile.editLoading}
                onCancel={editForm.close}
                onSubmit={async (update) => {
                  await profile.update(update)
                  editForm.close()
                }}
              />
            )}
            {warnFormOpen && (
              <WarnForm
                userName={profile.user.username}
                loading={profile.warnLoading}
                onCancel={warnForm.close}
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
          description="Withdraw this warning? The student is not notified; the notification went out when it was issued."
          confirmLabel="Withdraw warning"
          confirmColor="red"
          onConfirm={() => profile.withdrawWarning(withdrawing)}
          onClose={() => setWithdrawing(null)}
        />
      )}
    </>
  )
}
