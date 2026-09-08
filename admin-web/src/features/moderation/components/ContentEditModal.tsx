import { useState, type FormEvent } from 'react'
import { Button, Group, Modal, Select, Stack, Text, Textarea } from '@mantine/core'
import type { ContentUpdate } from '../../../api/CommentsService'
import ErrorAlert from '../../../components/ErrorAlert'
import { darkInputStyles } from '../../../constants/inputStyles'
import { darkModalStyles } from '../../../constants/modalStyles'
import { EDITABLE_CONTENT_STATUSES, isEditableContentStatus } from '../../../domain/moderation'
import { enumLabel } from '../../../utils/enumLabel'
import { getErrorMessage } from '../../../utils/getErrorMessage'
import {
  buildContentUpdate,
  canSaveContentEdit,
  createContentEditDraft,
  type ModeratedItem,
} from '../moderationModel'

const statusOptions = EDITABLE_CONTENT_STATUSES.map((status) => ({
  value: status,
  label: enumLabel(status),
}))

interface ContentEditModalProps {
  item: ModeratedItem | null
  onClose: () => void
  onSubmit: (item: ModeratedItem, update: ContentUpdate) => Promise<void>
}

export default function ContentEditModal({ item, onClose, onSubmit }: ContentEditModalProps) {
  return (
    <Modal
      opened={item !== null}
      onClose={onClose}
      title={`Edit ${item?.kind ?? 'content'}`}
      centered
      size="lg"
      styles={darkModalStyles}
    >
      {/* Keyed on the item so the form starts from that item's values: the fields are
          initial state, not state kept in step with a prop. */}
      {item && <ContentEditForm key={item.id} item={item} onClose={onClose} onSubmit={onSubmit} />}
    </Modal>
  )
}

interface ContentEditFormProps {
  item: ModeratedItem
  onClose: () => void
  onSubmit: (item: ModeratedItem, update: ContentUpdate) => Promise<void>
}

/**
 * Edits the text and the visibility of a comment or an answer. Only the fields that actually
 * changed are sent — the backend rejects an empty body and treats an unchanged one as a no-op.
 */
function ContentEditForm({ item, onClose, onSubmit }: ContentEditFormProps) {
  const [draft, setDraft] = useState(() => createContentEditDraft(item))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const update = buildContentUpdate(item, draft)
  const canSave = canSaveContentEdit(item, draft)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSave) return

    setSaving(true)
    setError('')
    try {
      await onSubmit(item, update)
      onClose()
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError, 'The change could not be saved.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap={14}>
        <Text size="xs" c="#6b7280">
          {item.postContext} · by {item.author.name}
        </Text>
        <Textarea
          label="Text"
          value={draft.content}
          onChange={(event) => {
            const content = event.currentTarget.value
            setDraft((current) => ({ ...current, content }))
          }}
          minRows={5}
          styles={darkInputStyles}
        />
        <Select
          label="Visibility"
          description="Hidden content is filtered out of the student app but kept in the database."
          data={statusOptions}
          value={draft.status}
          onChange={(value) => {
            if (isEditableContentStatus(value)) {
              setDraft((current) => ({ ...current, status: value }))
            }
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
  )
}
