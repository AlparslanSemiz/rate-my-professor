import { Badge, Group, Text, UnstyledButton } from '@mantine/core'
import { roleAccent } from '../constants/colors'
import { enumLabel } from '../utils/enumLabel'

interface UserChipProps {
  id: string
  name: string
  role: string
  warningCount: number
  status: string
  onClick: (id: string) => void
}

export default function UserChip({ id, name, role, warningCount, status, onClick }: UserChipProps) {
  return (
    <UnstyledButton
      onClick={(e) => { e.stopPropagation(); onClick(id) }}
      style={{ display: 'inline-flex', flexDirection: 'column', gap: 2 }}
    >
      <Text
        size="sm"
        fw={500}
        c="#e2e8f0"
        style={{
          textDecoration: 'underline',
          textDecorationColor: 'rgba(255,255,255,0.15)',
          cursor: 'pointer',
        }}
      >
        {name}
      </Text>
      <Group gap={4}>
        <Text size="xs" style={{ color: roleAccent[role] ?? '#6b7280' }}>{enumLabel(role)}</Text>
        {warningCount > 0 && (
          <Badge size="xs" color="yellow" variant="light">{warningCount}⚠</Badge>
        )}
        {status === 'BLOCKED' && (
          <Badge size="xs" color="red" variant="light">Blocked</Badge>
        )}
      </Group>
    </UnstyledButton>
  )
}
