import { useState, type CSSProperties } from 'react'
import { Box, Button, Group, Text, TextInput, Textarea } from '@mantine/core'
import { useForm } from '@mantine/form'
import type { BugReport, BugReportUpdate } from '@/api/feedback'
import ErrorAlert from '@/components/ErrorAlert'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { KIT } from '@/constants/colors'
import {
  buildBugReportUpdate,
  canSaveBugReportEdit,
  createBugReportEditDraft,
  type BugReportEditDraft,
} from '../model'

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

/**
 * Rewrites the title and description so a report filed with a useless title becomes findable.
 *
 * Only the changed fields are sent, and the diff is `buildBugReportUpdate` rather than
 * something this component works out — the backend rejects an empty body, and the rule is
 * worth stating once where it can be tested. There is no local `saving`: the parent's
 * mutation owns it, and no close-on-success either, because `BugReportDetails` does that.
 */
export default function BugReportEditForm({
  report,
  loading,
  onCancel,
  onSubmit,
}: BugReportEditFormProps) {
  const form = useForm<BugReportEditDraft>({ initialValues: createBugReportEditDraft(report) })
  const [error, setError] = useState('')

  const canSave = canSaveBugReportEdit(report, form.values)

  async function handleSubmit() {
    if (!canSave) return

    setError('')
    try {
      await onSubmit(buildBugReportUpdate(report, form.values))
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError, 'The change could not be saved.'))
    }
  }

  return (
    <Box component="form" mb={20} style={formStyle} onSubmit={form.onSubmit(handleSubmit)}>
      <Text size="xs" fw={600} c={KIT.blue} mb={10}>
        Edit report
      </Text>
      <TextInput label="Title" size="sm" mb={10} {...form.getInputProps('title')} />
      <Textarea
        label="Description"
        minRows={4}
        size="sm"
        mb={12}
        {...form.getInputProps('description')}
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
