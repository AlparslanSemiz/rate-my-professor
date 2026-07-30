import { Button, Group, type CSSProperties } from '@mantine/core'
import {
  IconAlertTriangle,
  IconPencil,
  IconShieldCheck,
  IconShieldOff,
  IconTrash,
} from '@tabler/icons-react'
import type { User } from '../../../api/UsersService'
import type { ConfirmAction } from '../userConfirmation'

export type { ConfirmAction } from '../userConfirmation'

const deleteButtonStyle: CSSProperties = { marginLeft: 'auto' }

interface ProfileActionsProps {
  user: User
  /** True when the profile belongs to the signed-in admin; the backend protects those. */
  isSelf: boolean
  onToggleEdit: () => void
  onToggleWarning: () => void
  onConfirm: (action: ConfirmAction) => void
}

export default function ProfileActions({
  user,
  isSelf,
  onToggleEdit,
  onToggleWarning,
  onConfirm,
}: ProfileActionsProps) {
  const isBlocked = user.status === 'BLOCKED'
  // Self and other admin accounts cannot be warned, blocked, unblocked or deleted — the
  // backend answers 409 either way, so those buttons are not offered. Profile fields of an
  // admin account are editable, so Edit stays.
  const isProtected = isSelf || user.role === 'ADMIN'

  return (
    <Group gap={8} mb={20}>
      <Button
        size="xs"
        variant="light"
        color="blue"
        leftSection={<IconPencil size={13} />}
        onClick={onToggleEdit}
      >
        Edit
      </Button>
      {!isProtected && (
        <>
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
        </>
      )}
    </Group>
  )
}
