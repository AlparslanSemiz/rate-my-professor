import { useState } from 'react'
import {
  Modal,
  Text,
  Badge,
  Box,
  Group,
  Divider,
  Textarea,
  Button,
  Loader,
  Center,
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
import { roleAccent } from '../constants/colors'
import { formatDate } from '../utils/formatDate'

interface UserProfileModalProps {
  userId: number | null
  opened: boolean
  onClose: () => void
  onUserChanged?: (id: number, change: UserChange) => void
}

export default function UserProfileModal({ userId, opened, onClose, onUserChanged }: UserProfileModalProps) {
  const { user, warnings, loading, warnLoading, reset, warn, block, unblock, remove } =
    useUserProfile(userId, opened, onUserChanged)

  const [warnText, setWarnText] = useState('')
  const [showWarnForm, setShowWarnForm] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'block' | 'unblock' | 'delete' | null>(null)

  function handleClose() {
    reset()
    setWarnText('')
    setShowWarnForm(false)
    setConfirmAction(null)
    onClose()
  }

  async function handleWarn() {
    await warn(warnText)
    setWarnText('')
    setShowWarnForm(false)
  }

  async function handleDelete() {
    await remove()
    handleClose()
  }

  return (
    <>
      <Modal
        opened={opened}
        onClose={handleClose}
        title="User Profile"
        centered
        size="lg"
        styles={{
          content: { background: '#161b22', border: '1px solid #21262d' },
          header: { background: '#161b22', borderBottom: '1px solid #21262d' },
          title: { color: '#f1f5f9', fontWeight: 600 },
          close: { color: '#6b7280' },
        }}
      >
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
            {/* Header */}
            <Box mb={20}>
              <Group justify="space-between" align="flex-start">
                <div>
                  <Group gap={8} mb={6}>
                    <Text fw={700} c="#f1f5f9" style={{ fontSize: 20 }}>
                      {user.name}
                    </Text>
                    <Badge
                      size="sm"
                      variant="light"
                      style={{ background: `${roleAccent[user.role]}18`, color: roleAccent[user.role], borderColor: `${roleAccent[user.role]}30` }}
                    >
                      {user.role}
                    </Badge>
                    <Badge
                      size="sm"
                      variant="dot"
                      color={user.status === 'Active' ? 'green' : user.status === 'Blocked' ? 'red' : 'gray'}
                    >
                      {user.status}
                    </Badge>
                  </Group>
                  <Text size="sm" c="#6b7280">
                    {user.email}
                  </Text>
                </div>
                {user.warningCount > 0 && (
                  <Box
                    style={{
                      background: 'rgba(234,179,8,0.1)',
                      border: '1px solid rgba(234,179,8,0.25)',
                      borderRadius: 8,
                      padding: '6px 12px',
                      textAlign: 'center',
                    }}
                  >
                    <Text fw={700} c="#eab308" style={{ fontSize: 18, lineHeight: 1 }}>
                      {user.warningCount}
                    </Text>
                    <Text size="xs" c="#92400e">
                      warning{user.warningCount !== 1 ? 's' : ''}
                    </Text>
                  </Box>
                )}
              </Group>
            </Box>

            {/* Details grid */}
            <Box
              mb={20}
              style={{
                background: '#0f1117',
                border: '1px solid #21262d',
                borderRadius: 10,
                padding: '14px 16px',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px' }}>
                {[
                  { label: 'Joined', value: user.joinedAt },
                  { label: 'Last seen', value: formatDate(user.lastSeenAt, { withTime: true }) },
                  { label: 'Reports received', value: user.reportCount > 0 ? `${user.reportCount} times` : 'None' },
                  { label: 'User ID', value: `#${user.id}` },
                ].map((item) => (
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
              {user.bio && (
                <>
                  <Divider color="#21262d" my={12} />
                  <Text size="xs" c="#4b5563" mb={4}>Bio</Text>
                  <Text size="sm" c="#9ca3af">{user.bio}</Text>
                </>
              )}
            </Box>

            {/* Actions */}
            <Group gap={8} mb={20}>
              <Button
                size="xs"
                variant="light"
                color="yellow"
                leftSection={<IconAlertTriangle size={13} />}
                onClick={() => setShowWarnForm((v) => !v)}
              >
                Warn
              </Button>
              {user.status === 'Blocked' ? (
                <Button
                  size="xs"
                  variant="light"
                  color="green"
                  leftSection={<IconShieldCheck size={13} />}
                  onClick={() => setConfirmAction('unblock')}
                >
                  Unblock
                </Button>
              ) : (
                <Button
                  size="xs"
                  variant="light"
                  color="orange"
                  leftSection={<IconShieldOff size={13} />}
                  onClick={() => setConfirmAction('block')}
                >
                  Block
                </Button>
              )}
              <Button
                size="xs"
                variant="light"
                color="red"
                leftSection={<IconTrash size={13} />}
                onClick={() => setConfirmAction('delete')}
                style={{ marginLeft: 'auto' }}
              >
                Delete account
              </Button>
            </Group>

            {/* Warn form */}
            {showWarnForm && (
              <Box
                mb={20}
                style={{
                  background: 'rgba(234,179,8,0.05)',
                  border: '1px solid rgba(234,179,8,0.2)',
                  borderRadius: 10,
                  padding: '14px 16px',
                }}
              >
                <Text size="xs" fw={600} c="#eab308" mb={8}>
                  Issue a warning to {user.name}
                </Text>
                <Textarea
                  placeholder="Describe the reason for this warning..."
                  value={warnText}
                  onChange={(e) => setWarnText(e.currentTarget.value)}
                  minRows={3}
                  mb={10}
                  styles={{
                    input: {
                      background: '#0f1117',
                      border: '1px solid #21262d',
                      color: '#e2e8f0',
                      fontSize: 13,
                    },
                  }}
                />
                <Group gap={8} justify="flex-end">
                  <Button size="xs" variant="subtle" color="gray" onClick={() => { setShowWarnForm(false); setWarnText('') }}>
                    Cancel
                  </Button>
                  <Button size="xs" color="yellow" loading={warnLoading} disabled={!warnText.trim()} onClick={handleWarn}>
                    Send warning
                  </Button>
                </Group>
              </Box>
            )}

            {/* Warning history */}
            <Box>
              <Group gap={6} mb={12}>
                <IconClock size={13} color="#6b7280" />
                <Text size="xs" fw={600} c="#6b7280" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                  Warning history ({warnings.length})
                </Text>
              </Group>
              {warnings.length === 0 ? (
                <Box
                  style={{
                    background: '#0f1117',
                    border: '1px solid #21262d',
                    borderRadius: 8,
                    padding: '16px',
                    textAlign: 'center',
                  }}
                >
                  <IconUser size={20} color="#374151" style={{ marginBottom: 6 }} />
                  <Text size="xs" c="#4b5563">No warnings issued.</Text>
                </Box>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {warnings.map((w) => (
                    <Box
                      key={w.id}
                      style={{
                        background: '#0f1117',
                        border: '1px solid rgba(234,179,8,0.15)',
                        borderLeft: '3px solid #eab308',
                        borderRadius: 8,
                        padding: '10px 14px',
                      }}
                    >
                      <Text size="sm" c="#d1d5db" mb={4}>
                        {w.message}
                      </Text>
                      <Text size="xs" c="#4b5563">
                        {formatDate(w.issuedAt, { withTime: true })} · by {w.issuedBy}
                      </Text>
                    </Box>
                  ))}
                </div>
              )}
            </Box>
          </>
        )}
      </Modal>

      <ConfirmModal
        opened={confirmAction === 'block'}
        title="Block user"
        description={`Block ${user?.name ?? 'this user'}? They will lose access to the platform. You can unblock them later.`}
        confirmLabel="Block user"
        confirmColor="orange"
        onConfirm={block}
        onClose={() => setConfirmAction(null)}
      />

      <ConfirmModal
        opened={confirmAction === 'unblock'}
        title="Unblock user"
        description={`Unblock ${user?.name ?? 'this user'}? They will regain access to the platform.`}
        confirmLabel="Unblock user"
        confirmColor="green"
        onConfirm={unblock}
        onClose={() => setConfirmAction(null)}
      />

      <ConfirmModal
        opened={confirmAction === 'delete'}
        title="Delete account"
        description={`Permanently delete ${user?.name ?? 'this user'}'s account? This action cannot be undone.`}
        confirmLabel="Delete permanently"
        confirmColor="red"
        onConfirm={handleDelete}
        onClose={() => setConfirmAction(null)}
      />
    </>
  )
}
