import { Button, Group, type CSSProperties } from '@mantine/core'
import {
  IconAlertTriangle,
  IconShieldCheck,
  IconShieldOff,
  IconTrash,
} from '@tabler/icons-react'
import type { User } from '../../../api/UsersService'

export type ConfirmAction = 'block' | 'unblock' | 'delete'

const deleteButtonStyle: CSSProperties = { marginLeft: 'auto' }

interface ProfileActionsProps {
  user: User
  onToggleWarning: () => void
  onConfirm: (action: ConfirmAction) => void
}

export default function ProfileActions({
  user,
  onToggleWarning,
  onConfirm,
}: ProfileActionsProps) {
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
