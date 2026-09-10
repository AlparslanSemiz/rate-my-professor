import { Select, TextInput } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import FilterBar from '@/components/FilterBar'
import {
  reasonFilterOptions,
  reportStatusFilterOptions,
  toReasonFilter,
  toStatusFilter,
  type ReasonFilter,
  type StatusFilter,
} from '../model'
import { chrome, iconSize } from '@/theme'
import { filterFieldWidth } from '@/constants/layout'

interface ReportFiltersProps {
  search: string
  status: StatusFilter
  reason: ReasonFilter
  searchLabel: string
  onSearchChange: (value: string) => void
  onStatusChange: (value: StatusFilter) => void
  onReasonChange: (value: ReasonFilter) => void
}

export default function ReportFilters({
  search,
  status,
  reason,
  searchLabel,
  onSearchChange,
  onStatusChange,
  onReasonChange,
}: ReportFiltersProps) {
  return (
    <FilterBar>
      <TextInput
        placeholder="Search by content, user, or report message..."
        value={search}
        onChange={(event) => onSearchChange(event.currentTarget.value)}
        leftSection={<IconSearch size={iconSize.inline} color={chrome.textDim} />}
        style={filterFieldWidth.search}
        size="sm"
        aria-label={searchLabel}
      />
      <Select
        placeholder="All Statuses"
        aria-label="Filter by report status"
        data={reportStatusFilterOptions}
        value={status}
        onChange={(value) => onStatusChange(toStatusFilter(value))}
        style={filterFieldWidth.select}
        size="sm"
        clearable={false}
      />
      <Select
        placeholder="All Reasons"
        aria-label="Filter by report reason"
        data={reasonFilterOptions}
        value={reason}
        onChange={(value) => onReasonChange(toReasonFilter(value))}
        style={filterFieldWidth.select}
        size="sm"
        clearable={false}
      />
    </FilterBar>
  )
}
