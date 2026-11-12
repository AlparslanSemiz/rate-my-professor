import { Badge, Text, type CSSProperties, type MantineColor } from '@mantine/core'
import { EMPTY_VALUE } from '@/utils/emptyValue'
import type { User } from '@/api/users'
import { roleColor, userStatusColor } from '@/constants/colors'
import { enumLabel } from '@/utils/enumLabel'
import { formatDate } from '@/utils/formatDate'
import { chrome } from '@/theme'
import ClickableRow from '@/components/ClickableRow'
import { tableCellPadding } from '@/constants/layout'

const cellStyle: CSSProperties = { padding: tableCellPadding }
const dateTextStyle: CSSProperties = { whiteSpace: 'nowrap' }

function rowStyle(isLast: boolean): CSSProperties {
  return {
    borderBottom: isLast ? 'none' : `1px solid ${chrome.borderSubtle}`,
  }
}

interface UserTableRowProps {
  user: User
  isLast: boolean
  onOpenProfile: (id: string) => void
}

export default function UserTableRow({ user, isLast, onOpenProfile }: UserTableRowProps) {
  const openProfile = () => onOpenProfile(user.id)

  return (
    <ClickableRow
      style={rowStyle(isLast)}
      onActivate={openProfile}
      label={`Open the profile of ${user.username}`}
    >
      <td style={cellStyle}>
        <Text size="sm" fw={500} c={chrome.textPrimary}>
          {user.username}
        </Text>
      </td>
      <td style={cellStyle}>
        <Text size="sm" c={chrome.textDim}>
          {user.kitEmail}
        </Text>
      </td>
      <td style={cellStyle}>
        <Badge color={roleColor[user.role]} variant="light" size="sm">
          {enumLabel(user.role)}
        </Badge>
      </td>
      <td style={cellStyle}>
        <Badge color={userStatusColor[user.status]} variant="dot" size="sm">
          {enumLabel(user.status)}
        </Badge>
      </td>
      <td style={cellStyle}>
        <CountBadge value={user.warnings} color="yellow" />
      </td>
      <td style={cellStyle}>
        <CountBadge value={user.reports} color="red" />
      </td>
      <td style={cellStyle}>
        <Text size="xs" c={chrome.textDim} style={dateTextStyle}>
          {formatDate(user.lastOnline)}
        </Text>
      </td>
      <td style={cellStyle}>
        <Text size="xs" c={chrome.textDim} style={dateTextStyle}>
          {formatDate(user.joined)}
        </Text>
      </td>
    </ClickableRow>
  )
}

function CountBadge({ value, color }: { value: number; color: MantineColor }) {
  if (value <= 0) {
    return (
      <Text size="xs" c={chrome.iconFaint}>
        {EMPTY_VALUE}
      </Text>
    )
  }

  return (
    <Badge color={color} variant="light" size="sm">
      {value}
    </Badge>
  )
}
