import { useEffect, useState, type FormEvent } from 'react'
import { Button, Group, Modal, Select, Stack, Text, Textarea } from '@mantine/core'
import type { ContentUpdate } from '../../../api/CommentsService'
import ErrorAlert from '../../../components/ErrorAlert'
import { darkInputStyles } from '../../../constants/inputStyles'
import { darkModalStyles } from '../../../constants/modalStyles'
import {
  EDITABLE_CONTENT_STATUSES,
  isEditableContentStatus,
  type EditableContentStatus,
} from '../../../domain/moderation'
import { enumLabel } from '../../../utils/enumLabel'
import { getErrorMessage } from '../../../utils/getErrorMessage'
import type { ModeratedItem } from '../moderationModel'

const statusOptions = EDITABLE_CONTENT_STATUSES.map((status) => ({
  value: status,
  label: enumLabel(status),
}))

/** A `DELETED` item cannot be put back to a visibility, so editing starts from `HIDDEN`. */
function toEditableStatus(item: ModeratedItem): EditableContentStatus {
  return item.status === 'VISIBLE' ? 'VISIBLE' : 'HIDDEN'
}

interface ContentEditModalProps {
  item: ModeratedItem | null
  noun: string
  onClose: () => void
  onSubmit: (id: string, update: ContentUpdate) => Promise<void>
}

/**
 * Edits the text and the visibility of a comment or an answer. Only the fields that actually
 * changed are sent — the backend rejects an empty body and treats an unchanged one as a no-op.
 */
export default function ContentEditModal({
  item,
  noun,
  onClose,
  onSubmit,
}: ContentEditModalProps) {
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<EditableContentStatus>('VISIBLE')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!item) return
    setContent(item.content)
    setStatus(toEditableStatus(item))
    setError('')
  }, [item])

  const trimmedContent = content.trim()
  const contentChanged = item !== null && trimmedContent !== item.content
  const statusChanged = item !== null && status !== toEditableStatus(item)
  const canSave = trimmedContent.length > 0 && (contentChanged || statusChanged)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!item || !canSave) return

    const update: ContentUpdate = {}
    if (contentChanged) update.content = trimmedContent
    if (statusChanged) update.status = status

    setSaving(true)
    setError('')
    try {
      await onSubmit(item.id, update)
      onClose()
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError, 'The change could not be saved.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      opened={item !== null}
      onClose={onClose}
      title={`Edit ${noun}`}
      centered
      size="lg"
      styles={darkModalStyles}
      closeOnClickOutside={!saving}
      closeOnEscape={!saving}
      withCloseButton={!saving}
    >
      {item && (
        <form onSubmit={handleSubmit}>
          <Stack gap={14}>
            <Text size="xs" c="#6b7280">
              {item.postContext} · by {item.author.name}
            </Text>
            <Textarea
              label="Text"
              value={content}
              onChange={(event) => setContent(event.currentTarget.value)}
              minRows={5}
              styles={darkInputStyles}
            />
            <Select
              label="Visibility"
              description="Hidden content is filtered out of the student app but kept in the database."
              data={statusOptions}
              value={status}
              onChange={(value) => {
                if (isEditableContentStatus(value)) setStatus(value)
              }}
              clearable={false}
              styles={darkInputStyles}
            />
            <ErrorAlert message={error} mb={0} />
            <Group justify="flex-end" gap={10}>
              <Button variant="subtle" color="gray" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" color="green" loading={saving} disabled={!canSave}>
                Save changes
              </Button>
            </Group>
          </Stack>
        </form>
      )}
    </Modal>
  )
}
