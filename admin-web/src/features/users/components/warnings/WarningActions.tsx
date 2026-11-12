import { ActionIcon, Group, Tooltip } from '@mantine/core'
import { IconPencil, IconTrash } from '@tabler/icons-react'
import type { Warning } from '@/api/users'
import { iconSize } from '@/theme'

interface WarningActionsProps {
  warning: Warning
  busy: boolean
  onEdit: () => void
  onWithdraw: () => void
}

/**
 * A warning can only be corrected or withdrawn when the backend told us its id. It has done
 * so since the 2026-08-20 release; against anything older the controls stay hidden rather
 * than offering an action that has nothing to address.
 */
export default function WarningActions({
  warning,
  busy,
  onEdit,
  onWithdraw,
}: WarningActionsProps) {
  if (warning.id === null) return null

  return (
    <Group gap={2} wrap="nowrap">
      <Tooltip label="Correct the wording" withArrow>
        <ActionIcon
          variant="subtle"
          color="yellow"
          size="sm"
          disabled={busy}
          aria-label="Edit warning"
          onClick={onEdit}
        >
          <IconPencil size={iconSize.inline} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Withdraw this warning" withArrow>
        <ActionIcon
          variant="subtle"
          color="red"
          size="sm"
          disabled={busy}
          aria-label="Withdraw warning"
          onClick={onWithdraw}
        >
          <IconTrash size={iconSize.inline} />
        </ActionIcon>
      </Tooltip>
    </Group>
  )
}
