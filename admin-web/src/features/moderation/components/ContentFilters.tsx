import { Group, Select, TextInput, type CSSProperties } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import Panel from '@/components/Panel'
import {
  contentStatusFilterOptions,
  toContentStatusFilter,
  type ContentStatusFilter,
} from '../model'
import { chrome, iconSize } from '@/theme'
import { controlWidth } from '@/constants/layout'

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
          leftSection={<IconSearch size={iconSize.inline} color={chrome.textDim} />}
          style={searchInputStyle}
          size="sm"
          aria-label={searchLabel}
        />
        <Select
          placeholder="All Statuses"
          aria-label="Filter by visibility"
          data={contentStatusFilterOptions}
          value={status}
          onChange={(value) => onStatusChange(toContentStatusFilter(value))}
          w={controlWidth.medium}
          size="sm"
          clearable={false}
        />
      </Group>
    </Panel>
  )
}
