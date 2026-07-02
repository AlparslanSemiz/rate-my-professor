import { Button, Center, Stack, Text } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'

interface LoadErrorProps {
  message: string
  onRetry: () => void
}

export default function LoadError({ message, onRetry }: LoadErrorProps) {
  return (
    <Center h={200}>
      <Stack align="center" gap={10}>
        <IconAlertCircle size={28} color="#ef4444" />
        <Text c="#9ca3af" size="sm">
          {message}
        </Text>
        <Button size="xs" variant="light" color="green" onClick={onRetry}>
          Try again
        </Button>
      </Stack>
    </Center>
  )
}
