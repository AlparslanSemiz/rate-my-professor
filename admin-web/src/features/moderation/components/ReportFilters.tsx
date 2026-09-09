import { Group, Select, TextInput, type CSSProperties } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import Panel from '@/components/Panel'
import {
  reasonFilterOptions,
  reportStatusFilterOptions,
  toReasonFilter,
  toStatusFilter,
  type ReasonFilter,
  type StatusFilter,
} from '../model'
import { chrome, iconSize } from '@/theme'
import { controlWidth } from '@/constants/layout'

const panelStyle: CSSProperties = { padding: '14px 20px' }
const searchInputStyle: CSSProperties = { flex: 1, minWidth: 200 }

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
    <Panel mb={16} style={panelStyle}>
      <Group gap={12} wrap="wrap">
        <TextInput
          placeholder="Search by content, user, or report message..."
          value={search}
          onChange={(event) => onSearchChange(event.currentTarget.value)}
          leftSection={<IconSearch size={iconSize.inline} color={chrome.textDim} />}
          style={searchInputStyle}
          size="sm"
          aria-label={searchLabel}
        />
        <Select
          placeholder="All Statuses"
          aria-label="Filter by report status"
          data={reportStatusFilterOptions}
          value={status}
          onChange={(value) => onStatusChange(toStatusFilter(value))}
          w={controlWidth.compact}
          size="sm"
          clearable={false}
        />
        <Select
          placeholder="All Reasons"
          aria-label="Filter by report reason"
          data={reasonFilterOptions}
          value={reason}
          onChange={(value) => onReasonChange(toReasonFilter(value))}
          w={controlWidth.roomy}
          size="sm"
          clearable={false}
        />
      </Group>
    </Panel>
  )
}
