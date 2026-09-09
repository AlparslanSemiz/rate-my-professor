import { useState, type CSSProperties, type FormEvent } from 'react'
import { Box, Button, Group, Text, TextInput, Textarea } from '@mantine/core'
import type { BugReport, BugReportUpdate } from '@/api/feedback'
import ErrorAlert from '@/components/ErrorAlert'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { KIT } from '@/constants/colors'

const formStyle: CSSProperties = {
  background: 'rgba(59,130,246,0.05)',
  border: '1px solid rgba(59,130,246,0.2)',
  borderRadius: 10,
  padding: '14px 16px',
}

interface BugReportEditFormProps {
  report: BugReport
  loading: boolean
  onCancel: () => void
  onSubmit: (update: BugReportUpdate) => Promise<void>
}

/** Rewrites the title and description so a report filed with a useless title becomes findable. */
export default function BugReportEditForm({
  report,
  loading,
  onCancel,
  onSubmit,
}: BugReportEditFormProps) {
  const [title, setTitle] = useState(report.title)
  const [description, setDescription] = useState(report.description)
  const [error, setError] = useState('')

  const trimmedTitle = title.trim()
  const trimmedDescription = description.trim()

  const update: BugReportUpdate = {}
  if (trimmedTitle !== report.title) update.title = trimmedTitle
  if (trimmedDescription !== report.description) update.description = trimmedDescription

  const canSave = trimmedTitle.length > 0 && Object.keys(update).length > 0

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSave) return

    setError('')
    try {
      await onSubmit(update)
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError, 'The change could not be saved.'))
    }
  }

  return (
    <Box component="form" mb={20} style={formStyle} onSubmit={handleSubmit}>
      <Text size="xs" fw={600} c={KIT.blue} mb={10}>
        Edit report
      </Text>
      <TextInput
        label="Title"
        value={title}
        onChange={(event) => setTitle(event.currentTarget.value)}
        size="sm"
        mb={10}
      />
      <Textarea
        label="Description"
        value={description}
        onChange={(event) => setDescription(event.currentTarget.value)}
        minRows={4}
        size="sm"
        mb={12}
      />
      <ErrorAlert message={error} />
      <Group gap={8} justify="flex-end">
        <Button
          type="button"
          size="xs"
          variant="subtle"
          color="gray"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" size="xs" color="blue" loading={loading} disabled={!canSave}>
          Save changes
        </Button>
      </Group>
    </Box>
  )
}
