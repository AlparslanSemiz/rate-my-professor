import { Alert } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'

interface ErrorAlertProps {
  message: string
  mb?: number
}

const errorAlertStyles = {
  root: {
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.2)',
  },
}

export default function ErrorAlert({ message, mb = 12 }: ErrorAlertProps) {
  if (!message) return null

  return (
    <Alert
      icon={<IconAlertCircle size={14} />}
      color="red"
      mb={mb}
      radius="md"
      styles={errorAlertStyles}
    >
      {message}
    </Alert>
  )
}
