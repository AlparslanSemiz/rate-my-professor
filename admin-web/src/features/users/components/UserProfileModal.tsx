import { useState } from 'react'
import { Center, Loader, Modal, Text, type MantineColor } from '@mantine/core'
import type { User } from '../../../api/UsersService'
import ConfirmModal from '../../../components/ConfirmModal'
import { darkModalStyles } from '../../../constants/modalStyles'
import { useUserProfile, type UserChange } from '../hooks/useUserProfile'
import ProfileActions, { type ConfirmAction } from './ProfileActions'
import ProfileSummary from './ProfileSummary'
import WarnForm from './WarnForm'
import WarningHistory from './WarningHistory'

interface UserProfileModalProps {
  userId: string | null
  opened: boolean
  onClose: () => void
  onUserChanged?: (id: string, change: UserChange) => void
}

interface ConfirmConfig {
  title: string
  description: string
  confirmLabel: string
  confirmColor: MantineColor
  onConfirm: () => Promise<void>
}

function confirmConfigFor(
  action: ConfirmAction,
  user: User,
  handlers: Record<ConfirmAction, () => Promise<void>>,
): ConfirmConfig {
  return {
    block: {
      title: 'Block user',
      description: `Block ${user.username}? They will lose access to the platform. You can unblock them later.`,
      confirmLabel: 'Block user',
      confirmColor: 'orange',
      onConfirm: handlers.block,
    },
    unblock: {
      title: 'Unblock user',
      description: `Unblock ${user.username}? They will regain access to the platform.`,
      confirmLabel: 'Unblock user',
      confirmColor: 'green',
      onConfirm: handlers.unblock,
    },
    delete: {
      title: 'Delete account',
      description: `Permanently delete ${user.username}'s account? This action cannot be undone.`,
      confirmLabel: 'Delete permanently',
      confirmColor: 'red',
      onConfirm: handlers.delete,
    },
  }[action]
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
      ? confirmConfigFor(confirmAction, profile.user, {
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
