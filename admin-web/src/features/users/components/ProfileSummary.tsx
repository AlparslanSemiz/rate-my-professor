import { Badge, Box, Divider, Group, Text, type CSSProperties } from '@mantine/core'
import type { User } from '@/api/users'
import { KIT, roleAccent, userStatusColor } from '@/constants/colors'
import { enumLabel } from '@/utils/enumLabel'
import { formatDate } from '@/utils/formatDate'
import { chrome } from '@/theme'

const profileTitleStyle: CSSProperties = { fontSize: 20 }
const warningSummaryStyle: CSSProperties = {
  background: 'rgba(234,179,8,0.1)',
  border: '1px solid rgba(234,179,8,0.25)',
  borderRadius: 8,
  padding: '6px 12px',
  textAlign: 'center',
}
const warningCountStyle: CSSProperties = { fontSize: 18, lineHeight: 1 }
const detailsPanelStyle: CSSProperties = {
  background: chrome.surfaceSunken,
  border: `1px solid ${chrome.border}`,
  borderRadius: 10,
  padding: '14px 16px',
}
const detailsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '10px 24px',
}

function roleBadgeStyle(role: User['role']): CSSProperties {
  return {
    background: `${roleAccent[role]}18`,
    color: roleAccent[role],
    borderColor: `${roleAccent[role]}30`,
  }
}

function profileFields(user: User) {
  return [
    { label: 'Joined', value: formatDate(user.joined) },
    { label: 'Last seen', value: formatDate(user.lastOnline, { withTime: true }) },
    { label: 'Reports received', value: user.reports > 0 ? `${user.reports} times` : 'None' },
    { label: 'User ID', value: `#${user.id.slice(0, 8)}` },
    { label: 'Credibility', value: String(user.credibilityScore) },
  ]
}

export default function ProfileSummary({ user }: { user: User }) {
  return (
    <>
      <Box mb={20}>
        <Group justify="space-between" align="flex-start">
          <div>
            <Group gap={8} mb={6}>
              <Text fw={700} c={chrome.textBright} style={profileTitleStyle}>
                {user.username}
              </Text>
              <Badge size="sm" variant="light" style={roleBadgeStyle(user.role)}>
                {enumLabel(user.role)}
              </Badge>
              <Badge size="sm" variant="dot" color={userStatusColor[user.status]}>
                {enumLabel(user.status)}
              </Badge>
            </Group>
            <Text size="sm" c={chrome.textDim}>
              {user.kitEmail}
            </Text>
          </div>
          {user.warnings > 0 && <WarningSummary count={user.warnings} />}
        </Group>
      </Box>

      <Box mb={20} style={detailsPanelStyle}>
        <div style={detailsGridStyle}>
          {profileFields(user).map((item) => (
            <div key={item.label}>
              <Text size="xs" c={chrome.textFaint} mb={1}>
                {item.label}
              </Text>
              <Text size="sm" c={chrome.textSecondary}>
                {item.value}
              </Text>
            </div>
          ))}
        </div>
        {user.biography && (
          <>
            <Divider color={chrome.border} my={12} />
            <Text size="xs" c={chrome.textFaint} mb={4}>
              Bio
            </Text>
            <Text size="sm" c={chrome.textMuted}>
              {user.biography}
            </Text>
          </>
        )}
      </Box>
    </>
  )
}

function WarningSummary({ count }: { count: number }) {
  return (
    <Box style={warningSummaryStyle}>
      <Text fw={700} c={KIT.yellow} style={warningCountStyle}>
        {count}
      </Text>
      <Text size="xs" c={KIT.yellow}>
        warning{count !== 1 ? 's' : ''}
      </Text>
    </Box>
  )
}
