import { Box, Group, Text, type CSSProperties } from '@mantine/core'
import { IconClock, IconUser } from '@tabler/icons-react'
import type { Warning } from '../../../api/UsersService'
import { formatDate } from '../../../utils/formatDate'

const sectionTitleStyle: CSSProperties = { letterSpacing: '0.05em' }
const emptyWarningsStyle: CSSProperties = {
  background: '#0f1117',
  border: '1px solid #21262d',
  borderRadius: 8,
  padding: '16px',
  textAlign: 'center',
}
const warningListStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}
const warningItemStyle: CSSProperties = {
  background: '#0f1117',
  border: '1px solid rgba(234,179,8,0.15)',
  borderLeft: '3px solid #eab308',
  borderRadius: 8,
  padding: '10px 14px',
}

export default function WarningHistory({ warnings }: { warnings: Warning[] }) {
  return (
    <Box>
      <Group gap={6} mb={12}>
        <IconClock size={13} color="#6b7280" />
        <Text size="xs" fw={600} c="#6b7280" tt="uppercase" style={sectionTitleStyle}>
          Warning history ({warnings.length})
        </Text>
      </Group>
      {warnings.length === 0 ? (
        <Box style={emptyWarningsStyle}>
          <IconUser size={20} color="#374151" style={{ marginBottom: 6 }} />
          <Text size="xs" c="#4b5563">
            No warnings issued.
          </Text>
        </Box>
      ) : (
        <div style={warningListStyle}>
          {warnings.map((warning) => (
            <Box
              key={`${warning.userID}-${warning.createdAt}-${warning.issuedBy}-${warning.message}`}
              style={warningItemStyle}
            >
              <Text size="sm" c="#d1d5db" mb={4}>
                {warning.message}
              </Text>
              <Text size="xs" c="#4b5563">
                {formatDate(warning.createdAt, { withTime: true })}
              </Text>
            </Box>
          ))}
        </div>
      )}
    </Box>
  )
}
