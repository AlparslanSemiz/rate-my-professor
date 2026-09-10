import { ActionIcon, Group, Tooltip } from '@mantine/core'
import { IconPencil, IconTrash } from '@tabler/icons-react'
import type { ModeratedItem } from '../model'
import { iconSize } from '@/theme'

interface ContentRowActionsProps {
  item: ModeratedItem
  updating: boolean
  onEdit: (item: ModeratedItem) => void
  onDelete: (item: ModeratedItem) => void
}

/** Edit and delete for one row. Labelled by author, so the two are distinguishable in a list. */
export default function ContentRowActions({
  item,
  updating,
  onEdit,
  onDelete,
}: ContentRowActionsProps) {
  return (
    // `F-087`: right-aligned because this cell is a percentage of the table rather than
    // sized to its content, so left-aligned icons ended 46.4px from the panel edge where the
    // catalogue's end 21px in. One inset, decided by the cell padding.
    <Group gap={4} wrap="nowrap" justify="flex-end">
      <Tooltip label="Edit text or visibility" withArrow>
        <ActionIcon
          variant="subtle"
          color="blue"
          size="sm"
          disabled={updating}
          aria-label={`Edit content by ${item.author.name}`}
          onClick={() => onEdit(item)}
        >
          <IconPencil size={iconSize.rowAction} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Delete permanently" withArrow>
        <ActionIcon
          variant="subtle"
          color="red"
          size="sm"
          disabled={updating}
          aria-label={`Delete content by ${item.author.name}`}
          onClick={() => onDelete(item)}
        >
          <IconTrash size={iconSize.rowAction} />
        </ActionIcon>
      </Tooltip>
    </Group>
  )
}
