import { Button, Group, Textarea } from '@mantine/core'
import { IconCheck, IconX } from '@tabler/icons-react'
import ErrorAlert from '@/components/ErrorAlert'
import { iconSize } from '@/theme'

interface WarningEditorProps {
  draft: string
  error: string
  busy: boolean
  onDraftChange: (draft: string) => void
  onCancel: () => void
  onSave: () => void
}

export default function WarningEditor({
  draft,
  error,
  busy,
  onDraftChange,
  onCancel,
  onSave,
}: WarningEditorProps) {
  return (
    <>
      <Textarea
        value={draft}
        onChange={(event) => onDraftChange(event.currentTarget.value)}
        minRows={2}
        size="xs"
        mb={8}
        aria-label="Warning message"
      />
      <ErrorAlert message={error} mb={8} />
      <Group gap={6} justify="flex-end">
        <Button
          size="compact-xs"
          variant="subtle"
          color="gray"
          leftSection={<IconX size={iconSize.badge} />}
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </Button>
        <Button
          size="compact-xs"
          color="yellow"
          leftSection={<IconCheck size={iconSize.badge} />}
          loading={busy}
          disabled={!draft.trim()}
          onClick={onSave}
        >
          Save
        </Button>
      </Group>
    </>
  )
}
