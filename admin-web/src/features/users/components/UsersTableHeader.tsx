import { Box, Group, Text, TextInput, type CSSProperties } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import { darkInputStyles } from '../../../constants/inputStyles'

const headerStyle: CSSProperties = { borderBottom: '1px solid #21262d' }
const searchInputStyle: CSSProperties = { flex: '1 1 240px', maxWidth: 320 }

interface UsersTableHeaderProps {
  filteredCount: number
  totalCount: number
  search: string
  onSearchChange: (value: string) => void
}

export default function UsersTableHeader({
  filteredCount,
  totalCount,
  search,
  onSearchChange,
}: UsersTableHeaderProps) {
  return (
    <Box px={20} py={16} style={headerStyle}>
      <Group justify="space-between">
        <div>
          <Text fw={600} c="#e2e8f0" size="sm">
            All users
          </Text>
          <Text size="xs" c="#4b5563">
            {filteredCount} of {totalCount} members · tap a row to open a profile
          </Text>
        </div>
        <TextInput
          placeholder="Search by name or email..."
          value={search}
          onChange={(event) => onSearchChange(event.currentTarget.value)}
          style={searchInputStyle}
          size="sm"
          aria-label="Search users"
          leftSection={<IconSearch size={14} color="#6b7280" />}
          styles={darkInputStyles}
        />
      </Group>
    </Box>
  )
}
