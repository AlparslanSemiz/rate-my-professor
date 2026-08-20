import { Box, Group, Text, type CSSProperties } from '@mantine/core'

const headerStyle: CSSProperties = { borderBottom: '1px solid #21262d' }

interface UsersTableHeaderProps {
  loadedCount: number
  sortLabel: string
}

export default function UsersTableHeader({ loadedCount, sortLabel }: UsersTableHeaderProps) {
  return (
    <Box px={20} py={16} style={headerStyle}>
      <Group justify="space-between">
        <div>
          <Text fw={600} c="#e2e8f0" size="sm">
            All users
          </Text>
          {/* Not "x of y": these are the rows read so far, and how many accounts exist is a
              question only the counters above can answer. */}
          <Text size="xs" c="#4b5563">
            {loadedCount} loaded · {sortLabel} · tap a row to open a profile
          </Text>
        </div>
      </Group>
    </Box>
  )
}
