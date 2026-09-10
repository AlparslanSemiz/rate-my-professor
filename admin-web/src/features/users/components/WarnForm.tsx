import { useState, type CSSProperties, type FormEvent } from 'react'
import { Box, Button, Group, Text, Textarea } from '@mantine/core'
import ErrorAlert from '@/components/ErrorAlert'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { KIT } from '@/constants/colors'

interface WarnFormProps {
  userName: string
  loading: boolean
  onCancel: () => void
  onSubmit: (message: string) => Promise<void>
}

const warnFormStyle: CSSProperties = {
  background: 'rgba(234,179,8,0.05)',
  border: '1px solid rgba(234,179,8,0.2)',
  borderRadius: 10,
  padding: '14px 16px',
}
/** The rest of the field is the panel's themed input; only the type is smaller here. */
const warningTextareaStyles = { input: { fontSize: 13 } }

export default function WarnForm({
  userName,
  loading,
  onCancel,
  onSubmit,
}: WarnFormProps) {
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    try {
      await onSubmit(message.trim())
      setMessage('')
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError, 'Failed to send the warning. No changes were saved.'))
    }
  }

  return (
    <Box component="form" mb={20} style={warnFormStyle} onSubmit={handleSubmit}>
      <Text size="xs" fw={600} c={KIT.yellow} mb={8}>
        Issue a warning to {userName}
      </Text>
      <Textarea
        /*
         * The heading above says who is being warned, but it is a `Text`, not a label, so the
         * field itself announced as a bare textbox. The placeholder is not a substitute: it
         * disappears as soon as the operator types. `WarningEditor` already names its field the
         * same way, which is what makes this an omission rather than a decision.
         */
        aria-label="Warning message"
        placeholder="Describe the reason for this warning..."
        value={message}
        onChange={(event) => setMessage(event.currentTarget.value)}
        minRows={3}
        mb={10}
        styles={warningTextareaStyles}
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
        <Button type="submit" size="xs" color="yellow" loading={loading} disabled={!message.trim()}>
          Send warning
        </Button>
      </Group>
    </Box>
  )
}
