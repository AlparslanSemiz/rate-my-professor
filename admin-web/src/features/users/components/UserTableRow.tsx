import { Badge, Text, type CSSProperties, type MantineColor } from '@mantine/core'
import type { User } from '../../../api/UsersService'
import { roleColor, userStatusColor } from '../../../constants/colors'
import { enumLabel } from '../../../utils/enumLabel'
import { formatDate } from '../../../utils/formatDate'
import { activateOnEnterOrSpace } from '../../../utils/keyboard'

const cellStyle: CSSProperties = { padding: '13px 20px' }
const dateTextStyle: CSSProperties = { whiteSpace: 'nowrap' }

function rowStyle(isLast: boolean): CSSProperties {
  return {
    borderBottom: isLast ? 'none' : '1px solid #1c2128',
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
    <tr
      className="row-interactive row-clickable"
      style={rowStyle(isLast)}
      onClick={openProfile}
      onKeyDown={(event) => activateOnEnterOrSpace(event, openProfile)}
      tabIndex={0}
    >
      <td style={cellStyle}>
        <Text size="sm" fw={500} c="#e2e8f0">
          {user.username}
        </Text>
      </td>
      <td style={cellStyle}>
        <Text size="sm" c="#6b7280">
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
        <Text size="xs" c="#6b7280" style={dateTextStyle}>
          {formatDate(user.lastOnline)}
        </Text>
      </td>
      <td style={cellStyle}>
        <Text size="xs" c="#6b7280" style={dateTextStyle}>
          {formatDate(user.joined)}
        </Text>
      </td>
    </tr>
  )
}

function CountBadge({ value, color }: { value: number; color: MantineColor }) {
  if (value <= 0) {
    return (
      <Text size="xs" c="#374151">
        —
      </Text>
    )
  }

  return (
    <Badge color={color} variant="light" size="sm">
      {value}
    </Badge>
  )
}
