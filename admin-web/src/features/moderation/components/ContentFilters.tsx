import { Group, Select, TextInput, type CSSProperties } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import Panel from '../../../components/Panel'
import { darkInputStyles } from '../../../constants/inputStyles'
import {
  contentStatusFilterOptions,
  toContentStatusFilter,
  type ContentStatusFilter,
} from '../moderationModel'

const panelStyle: CSSProperties = { padding: '14px 20px' }
const searchInputStyle: CSSProperties = { flex: 1, minWidth: 200 }

interface ContentFiltersProps {
  search: string
  status: ContentStatusFilter
  searchLabel: string
  onSearchChange: (value: string) => void
  onStatusChange: (value: ContentStatusFilter) => void
}

export default function ContentFilters({
  search,
  status,
  searchLabel,
  onSearchChange,
  onStatusChange,
}: ContentFiltersProps) {
  return (
    <Panel mb={16} style={panelStyle}>
      <Group gap={12} wrap="wrap">
        <TextInput
          placeholder="Search by text, author, or lecture..."
          value={search}
          onChange={(event) => onSearchChange(event.currentTarget.value)}
          leftSection={<IconSearch size={14} color="#6b7280" />}
          style={searchInputStyle}
          size="sm"
          aria-label={searchLabel}
          styles={darkInputStyles}
        />
        <Select
          placeholder="All Statuses"
          aria-label="Filter by visibility"
          data={contentStatusFilterOptions}
          value={status}
          onChange={(value) => onStatusChange(toContentStatusFilter(value))}
          w={160}
          size="sm"
          clearable={false}
          styles={darkInputStyles}
        />
      </Group>
    </Panel>
  )
}
