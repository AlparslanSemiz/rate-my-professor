import { useState } from 'react'
import { Center, Loader, Modal, Text } from '@mantine/core'
import ConfirmModal from '../../../components/ConfirmModal'
import { darkModalStyles } from '../../../constants/modalStyles'
import { useUserProfile, type UserChange } from '../hooks/useUserProfile'
import { getUserConfirmation, type ConfirmAction } from '../userConfirmation'
import ProfileActions from './ProfileActions'
import ProfileSummary from './ProfileSummary'
import WarnForm from './WarnForm'
import WarningHistory from './WarningHistory'

interface UserProfileModalProps {
  userId: string | null
  opened: boolean
  onClose: () => void
  onUserChanged?: (id: string, change: UserChange) => void
}

export default function UserProfileModal({
  userId,
  opened,
  onClose,
  onUserChanged,
}: UserProfileModalProps) {
  const profile = useUserProfile(userId, opened, onUserChanged)
  const [showWarnForm, setShowWarnForm] = useState(false)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)

  function handleClose() {
    profile.reset()
    setShowWarnForm(false)
    setConfirmAction(null)
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
        ) : !profile.user ? (
          <Center h={120}>
            <Text c="#4b5563" size="sm">
              User not found.
            </Text>
          </Center>
        ) : (
          <>
            <ProfileSummary user={profile.user} />
            <ProfileActions
              user={profile.user}
              onToggleWarning={() => setShowWarnForm((visible) => !visible)}
              onConfirm={setConfirmAction}
            />
            {showWarnForm && (
              <WarnForm
                userName={profile.user.username}
                loading={profile.warnLoading}
                onCancel={() => setShowWarnForm(false)}
                onSubmit={handleWarning}
              />
            )}
            <WarningHistory warnings={profile.warnings} />
          </>
        )}
      </Modal>

      {confirmConfig && (
        <ConfirmModal opened onClose={() => setConfirmAction(null)} {...confirmConfig} />
      )}
    </>
  )
}
