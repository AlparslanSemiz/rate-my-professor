import { Button, Center, Stack, Text } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import { KIT } from '../constants/colors'

interface LoadErrorProps {
  message: string
  onRetry: () => void
  retryLabel?: string
}

const ICON_SIZE = 28

export default function LoadError({ message, onRetry, retryLabel = 'Try again' }: LoadErrorProps) {
  return (
    <Center h={200}>
      <Stack align="center" gap={10} role="alert">
        <IconAlertCircle size={ICON_SIZE} color={KIT.red} />
        <Text c="#9ca3af" size="sm">
          {message}
        </Text>
        <Button size="xs" variant="light" color="green" onClick={onRetry}>
          {retryLabel}
        </Button>
      </Stack>
    </Center>
  )
}
