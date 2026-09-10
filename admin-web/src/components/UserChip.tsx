import { Badge, Group, Text, UnstyledButton } from '@mantine/core'
import type { CSSProperties, MouseEvent } from 'react'
import { roleAccent } from '@/constants/colors'
import { enumLabel } from '@/utils/enumLabel'
import type { UserRole, UserStatus } from '@/api/users'
import { chrome } from '@/theme'
import { userStatusColor } from '@/constants/colors'

interface UserChipProps {
  id: string
  name: string
  role: UserRole
  warningCount: number
  status: UserStatus
  onClick: (id: string) => void
}

const chipButtonStyle: CSSProperties = {
  display: 'inline-flex',
  flexDirection: 'column',
  gap: 2,
}

const userNameStyle: CSSProperties = {
  textDecoration: 'underline',
  textDecorationColor: 'rgba(255,255,255,0.15)',
  cursor: 'pointer',
}

export default function UserChip({ id, name, role, warningCount, status, onClick }: UserChipProps) {
  const warningLabel = `${warningCount} warning${warningCount === 1 ? '' : 's'}`

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    onClick(id)
  }

  return (
    <UnstyledButton
      aria-label={`Open ${name}'s profile`}
      onClick={handleClick}
      style={chipButtonStyle}
    >
      <Text size="sm" fw={500} c={chrome.textPrimary} style={userNameStyle}>
        {name}
      </Text>
      <Group gap={4}>
        <Text size="xs" style={{ color: roleAccent[role] }}>
          {enumLabel(role)}
        </Text>
        {warningCount > 0 && (
          <Badge size="xs" color="yellow" variant="light" aria-label={warningLabel}>
            {warningCount}
          </Badge>
        )}
        {status === 'BLOCKED' && (
          <Badge size="xs" color={userStatusColor.BLOCKED} variant="light">
            Blocked
          </Badge>
        )}
      </Group>
    </UnstyledButton>
  )
}
