import { Group, Select, TextInput, type CSSProperties } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import Panel from '../../../components/Panel'
import { darkInputStyles } from '../../../constants/inputStyles'
import {
  reasonFilterOptions,
  statusFilterOptions,
  toReasonFilter,
  toStatusFilter,
  type ReasonFilter,
  type StatusFilter,
} from '../commentFilters'

const panelStyle: CSSProperties = { padding: '14px 20px' }
const searchInputStyle: CSSProperties = { flex: 1, minWidth: 200 }

interface CommentFiltersProps {
  search: string
  status: StatusFilter
  reason: ReasonFilter
  onSearchChange: (value: string) => void
  onStatusChange: (value: StatusFilter) => void
  onReasonChange: (value: ReasonFilter) => void
}

export default function CommentFilters({
  search,
  status,
  reason,
  onSearchChange,
  onStatusChange,
  onReasonChange,
}: CommentFiltersProps) {
  return (
    <Panel mb={16} style={panelStyle}>
      <Group gap={12} wrap="wrap">
        <TextInput
          placeholder="Search by comment, user, or report message..."
          value={search}
          onChange={(event) => onSearchChange(event.currentTarget.value)}
          leftSection={<IconSearch size={14} color="#6b7280" />}
          style={searchInputStyle}
          size="sm"
          aria-label="Search reported comments"
          styles={darkInputStyles}
        />
        <Select
          placeholder="All Statuses"
          data={statusFilterOptions}
          value={status}
          onChange={(value) => onStatusChange(toStatusFilter(value))}
          w={150}
          size="sm"
          clearable={false}
          styles={darkInputStyles}
        />
        <Select
          placeholder="All Reasons"
          data={reasonFilterOptions}
          value={reason}
          onChange={(value) => onReasonChange(toReasonFilter(value))}
          w={180}
          size="sm"
          clearable={false}
          styles={darkInputStyles}
        />
      </Group>
    </Panel>
  )
}
