import { Select, TextInput } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import FilterBar from '@/components/FilterBar'
import {
  contentStatusFilterOptions,
  toContentStatusFilter,
  type ContentStatusFilter,
} from '../model'
import { chrome, iconSize } from '@/theme'
import { filterFieldWidth } from '@/constants/layout'

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
    <FilterBar>
      <TextInput
        placeholder="Search by text, author, or lecture..."
        value={search}
        onChange={(event) => onSearchChange(event.currentTarget.value)}
        leftSection={<IconSearch size={iconSize.inline} color={chrome.textDim} />}
        style={filterFieldWidth.search}
        size="sm"
        aria-label={searchLabel}
      />
      <Select
        placeholder="All Statuses"
        aria-label="Filter by visibility"
        data={contentStatusFilterOptions}
        value={status}
        onChange={(value) => onStatusChange(toContentStatusFilter(value))}
        style={filterFieldWidth.select}
        size="sm"
        clearable={false}
      />
    </FilterBar>
  )
}
