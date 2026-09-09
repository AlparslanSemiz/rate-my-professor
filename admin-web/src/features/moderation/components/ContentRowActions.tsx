import { ActionIcon, Group, Tooltip } from '@mantine/core'
import { IconPencil, IconTrash } from '@tabler/icons-react'
import type { ModeratedItem } from '../model'

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
    <Group gap={4} wrap="nowrap">
      <Tooltip label="Edit text or visibility" withArrow>
        <ActionIcon
          variant="subtle"
          color="blue"
          size="sm"
          disabled={updating}
          aria-label={`Edit content by ${item.author.name}`}
          onClick={() => onEdit(item)}
        >
          <IconPencil size={15} />
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
          <IconTrash size={15} />
        </ActionIcon>
      </Tooltip>
    </Group>
  )
}
