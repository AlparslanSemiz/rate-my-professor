import { Button, Group, type CSSProperties } from '@mantine/core'
import {
  IconAlertTriangle,
  IconPencil,
  IconShieldCheck,
  IconShieldOff,
  IconTrash,
} from '@tabler/icons-react'
import type { User } from '@/api/users'
import type { UserAccess } from '../model'
import { USER_ACTION_COLORS, blockToggleAction, type ConfirmAction } from '../model'
import { iconSize } from '@/theme'

export type { ConfirmAction } from '../model'

const deleteButtonStyle: CSSProperties = { marginLeft: 'auto' }

interface ProfileActionsProps {
  user: User
  access: Pick<UserAccess, 'canModerate'>
  onToggleEdit: () => void
  onToggleWarning: () => void
  onConfirm: (action: ConfirmAction) => void
}

export default function ProfileActions({
  user,
  access,
  onToggleEdit,
  onToggleWarning,
  onConfirm,
}: ProfileActionsProps) {
  // One decision, read four ways: the colour, the icon, the label and the action the button
  // fires all follow from it. They used to be four ternaries over the same condition.
  const blockAction = blockToggleAction(user.status)
  const isBlocked = blockAction === 'unblock'

  return (
    <Group gap={8} mb={20}>
      <Button
        size="xs"
        variant="light"
        color="blue"
        leftSection={<IconPencil size={iconSize.compact} />}
        onClick={onToggleEdit}
      >
        Edit
      </Button>
      {access.canModerate && (
        <>
          <Button
            size="xs"
            variant="light"
            color="yellow"
            leftSection={<IconAlertTriangle size={iconSize.compact} />}
            onClick={onToggleWarning}
          >
            Warn
          </Button>
          <Button
            size="xs"
            variant="light"
            color={USER_ACTION_COLORS[blockAction]}
            leftSection={
              isBlocked ? (
                <IconShieldCheck size={iconSize.compact} />
              ) : (
                <IconShieldOff size={iconSize.compact} />
              )
            }
            onClick={() => onConfirm(blockAction)}
          >
            {isBlocked ? 'Unblock' : 'Block'}
          </Button>
          <Button
            size="xs"
            variant="light"
            color={USER_ACTION_COLORS.delete}
            leftSection={<IconTrash size={iconSize.compact} />}
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
