import { useState } from 'react'
import { Box, Text, Textarea, Group, Button } from '@mantine/core'
import type { CSSProperties } from 'react'
import { darkInputStyles } from '../constants/inputStyles'

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

const warningTextareaStyles = {
  input: { ...darkInputStyles.input, fontSize: 13 },
}

export default function WarnForm({ userName, loading, onCancel, onSubmit }: WarnFormProps) {
  const [message, setMessage] = useState('')

  async function handleSubmit() {
    await onSubmit(message.trim())
    setMessage('')
  }

  return (
    <Box mb={20} style={warnFormStyle}>
      <Text size="xs" fw={600} c="#eab308" mb={8}>
        Issue a warning to {userName}
      </Text>
      <Textarea
        placeholder="Describe the reason for this warning..."
        value={message}
        onChange={(e) => setMessage(e.currentTarget.value)}
        minRows={3}
        mb={10}
        styles={warningTextareaStyles}
      />
      <Group gap={8} justify="flex-end">
        <Button size="xs" variant="subtle" color="gray" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="xs" color="yellow" loading={loading} disabled={!message.trim()} onClick={handleSubmit}>
          Send warning
        </Button>
      </Group>
    </Box>
  )
}
