import { Box, Group, Text, type CSSProperties } from '@mantine/core'
import { chrome } from '@/theme'

const headerStyle: CSSProperties = { borderBottom: `1px solid ${chrome.border}` }

interface UsersTableHeaderProps {
  loadedCount: number
  sortLabel: string
}

export default function UsersTableHeader({ loadedCount, sortLabel }: UsersTableHeaderProps) {
  return (
    <Box px={20} py={16} style={headerStyle}>
      <Group justify="space-between">
        <div>
          <Text fw={600} c={chrome.textPrimary} size="sm">
            All users
          </Text>
          {/* Not "x of y": these are the rows read so far, and how many accounts exist is a
              question only the counters above can answer. */}
          <Text size="xs" c={chrome.textFaint}>
            {loadedCount} loaded · {sortLabel} · tap a row to open a profile
          </Text>
        </div>
      </Group>
    </Box>
  )
}
