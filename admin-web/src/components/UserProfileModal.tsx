import { useState, type CSSProperties } from 'react'
import {
  Modal,
  Text,
  Badge,
  Box,
  Group,
  Divider,
  Button,
  Loader,
  Center,
  type MantineColor,
} from '@mantine/core'
import {
  IconShieldOff,
  IconShieldCheck,
  IconTrash,
  IconAlertTriangle,
  IconClock,
  IconUser,
} from '@tabler/icons-react'
import { useUserProfile, type UserChange } from '../hooks/useUserProfile'
import ConfirmModal from './ConfirmModal'
import WarnForm from './WarnForm'
import { roleAccent, userStatusColor } from '../constants/colors'
import { darkModalStyles } from '../constants/modalStyles'
import { formatDate } from '../utils/formatDate'
import { enumLabel } from '../utils/enumLabel'
import type { User, Warning } from '../api/UsersService'

interface UserProfileModalProps {
  userId: string | null
  opened: boolean
  onClose: () => void
  onUserChanged?: (id: string, change: UserChange) => void
}

type ConfirmAction = 'block' | 'unblock' | 'delete'

interface ConfirmConfig {
  title: string
  description: string
  confirmLabel: string
  confirmColor: MantineColor
  onConfirm: () => Promise<void>
}

const profileTitleStyle: CSSProperties = {
  fontSize: 20,
}

const warningSummaryStyle: CSSProperties = {
  background: 'rgba(234,179,8,0.1)',
  border: '1px solid rgba(234,179,8,0.25)',
  borderRadius: 8,
  padding: '6px 12px',
  textAlign: 'center',
}

const warningCountStyle: CSSProperties = {
  fontSize: 18,
  lineHeight: 1,
}

const detailsPanelStyle: CSSProperties = {
  background: '#0f1117',
  border: '1px solid #21262d',
  borderRadius: 10,
  padding: '14px 16px',
}

const detailsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '10px 24px',
}

const deleteButtonStyle: CSSProperties = {
  marginLeft: 'auto',
}

const sectionTitleStyle: CSSProperties = {
  letterSpacing: '0.05em',
}

const emptyWarningsStyle: CSSProperties = {
  background: '#0f1117',
  border: '1px solid #21262d',
  borderRadius: 8,
  padding: '16px',
  textAlign: 'center',
}

const emptyWarningIconStyle: CSSProperties = {
  marginBottom: 6,
}

const warningListStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const warningItemStyle: CSSProperties = {
  background: '#0f1117',
  border: '1px solid rgba(234,179,8,0.15)',
  borderLeft: '3px solid #eab308',
  borderRadius: 8,
  padding: '10px 14px',
}

function roleBadgeStyle(role: User['role']): CSSProperties {
  return {
    background: `${roleAccent[role]}18`,
    color: roleAccent[role],
    borderColor: `${roleAccent[role]}30`,
  }
}

function profileFields(user: User) {
  return [
    { label: 'Joined', value: formatDate(user.joined) },
    { label: 'Last seen', value: formatDate(user.lastOnline, { withTime: true }) },
    { label: 'Reports received', value: user.reports > 0 ? `${user.reports} times` : 'None' },
    { label: 'User ID', value: `#${user.id.slice(0, 8)}` },
  ]
}

function confirmConfigFor(
  action: ConfirmAction,
  user: User,
  handlers: Record<ConfirmAction, () => Promise<void>>
): ConfirmConfig {
  const configs: Record<ConfirmAction, ConfirmConfig> = {
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
  }

  return configs[action]
}

export default function UserProfileModal({ userId, opened, onClose, onUserChanged }: UserProfileModalProps) {
  const { user, warnings, loading, warnLoading, reset, warn, block, unblock, remove } =
    useUserProfile(userId, opened, onUserChanged)

  const [showWarnForm, setShowWarnForm] = useState(false)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)

  function handleClose() {
    reset()
    setShowWarnForm(false)
    setConfirmAction(null)
    onClose()
  }

  async function handleDelete() {
    await remove()
    handleClose()
  }

  async function handleWarning(message: string) {
    await warn(message)
    setShowWarnForm(false)
  }

  const confirmConfig = user && confirmAction
    ? confirmConfigFor(confirmAction, user, { block, unblock, delete: handleDelete })
    : null

  return (
    <>
      <Modal opened={opened} onClose={handleClose} title="User Profile" centered size="lg" styles={darkModalStyles}>
        {loading ? (
          <Center h={160}>
            <Loader color="green" size="sm" />
          </Center>
        ) : !user ? (
          <Center h={120}>
            <Text c="#4b5563" size="sm">User not found.</Text>
          </Center>
        ) : (
          <>
            <ProfileHeader user={user} />
            <ProfileDetails user={user} />

            <ProfileActions
              user={user}
              onToggleWarning={() => setShowWarnForm((visible) => !visible)}
              onConfirm={setConfirmAction}
            />

            {showWarnForm && (
              <WarnForm
                userName={user.username}
                loading={warnLoading}
                onCancel={() => setShowWarnForm(false)}
                onSubmit={handleWarning}
              />
            )}

            <WarningHistory warnings={warnings} />
          </>
        )}
      </Modal>

      {confirmConfig && (
        <ConfirmModal
          opened
          onClose={() => setConfirmAction(null)}
          {...confirmConfig}
        />
      )}
    </>
  )
}

function ProfileActions({
  user,
  onToggleWarning,
  onConfirm,
}: {
  user: User
  onToggleWarning: () => void
  onConfirm: (action: ConfirmAction) => void
}) {
  const isBlocked = user.status === 'BLOCKED'

  return (
    <Group gap={8} mb={20}>
      <Button
        size="xs"
        variant="light"
        color="yellow"
        leftSection={<IconAlertTriangle size={13} />}
        onClick={onToggleWarning}
      >
        Warn
      </Button>
      <Button
        size="xs"
        variant="light"
        color={isBlocked ? 'green' : 'orange'}
        leftSection={isBlocked ? <IconShieldCheck size={13} /> : <IconShieldOff size={13} />}
        onClick={() => onConfirm(isBlocked ? 'unblock' : 'block')}
      >
        {isBlocked ? 'Unblock' : 'Block'}
      </Button>
      <Button
        size="xs"
        variant="light"
        color="red"
        leftSection={<IconTrash size={13} />}
        onClick={() => onConfirm('delete')}
        style={deleteButtonStyle}
      >
        Delete account
      </Button>
    </Group>
  )
}

function ProfileHeader({ user }: { user: User }) {
  return (
    <Box mb={20}>
      <Group justify="space-between" align="flex-start">
        <div>
          <Group gap={8} mb={6}>
            <Text fw={700} c="#f1f5f9" style={profileTitleStyle}>
              {user.username}
            </Text>
            <Badge
              size="sm"
              variant="light"
              style={roleBadgeStyle(user.role)}
            >
              {enumLabel(user.role)}
            </Badge>
            <Badge
              size="sm"
              variant="dot"
              color={userStatusColor[user.status]}
            >
              {enumLabel(user.status)}
            </Badge>
          </Group>
          <Text size="sm" c="#6b7280">
            {user.kitEmail}
          </Text>
        </div>
        {user.warnings > 0 && (
          <Box style={warningSummaryStyle}>
            <Text fw={700} c="#eab308" style={warningCountStyle}>
              {user.warnings}
            </Text>
            <Text size="xs" c="#92400e">
              warning{user.warnings !== 1 ? 's' : ''}
            </Text>
          </Box>
        )}
      </Group>
    </Box>
  )
}

function ProfileDetails({ user }: { user: User }) {
  return (
    <Box mb={20} style={detailsPanelStyle}>
      <div style={detailsGridStyle}>
        {profileFields(user).map((item) => (
          <div key={item.label}>
            <Text size="xs" c="#4b5563" mb={1}>
              {item.label}
            </Text>
            <Text size="sm" c="#d1d5db">
              {item.value}
            </Text>
          </div>
        ))}
      </div>
      {user.biography && (
        <>
          <Divider color="#21262d" my={12} />
          <Text size="xs" c="#4b5563" mb={4}>Bio</Text>
          <Text size="sm" c="#9ca3af">{user.biography}</Text>
        </>
      )}
    </Box>
  )
}

function WarningHistory({ warnings }: { warnings: Warning[] }) {
  return (
    <Box>
      <Group gap={6} mb={12}>
        <IconClock size={13} color="#6b7280" />
        <Text size="xs" fw={600} c="#6b7280" tt="uppercase" style={sectionTitleStyle}>
          Warning history ({warnings.length})
        </Text>
      </Group>
      {warnings.length === 0 ? (
        <Box style={emptyWarningsStyle}>
          <IconUser size={20} color="#374151" style={emptyWarningIconStyle} />
          <Text size="xs" c="#4b5563">No warnings issued.</Text>
        </Box>
      ) : (
        <div style={warningListStyle}>
          {warnings.map((warning) => (
            <Box
              key={`${warning.userID}-${warning.createdAt}-${warning.issuedBy}-${warning.message}`}
              style={warningItemStyle}
            >
              <Text size="sm" c="#d1d5db" mb={4}>
                {warning.message}
              </Text>
              <Text size="xs" c="#4b5563">
                {formatDate(warning.createdAt, { withTime: true })}
              </Text>
            </Box>
          ))}
        </div>
      )}
    </Box>
  )
}
