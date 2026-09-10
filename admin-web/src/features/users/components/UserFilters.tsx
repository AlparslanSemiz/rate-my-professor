import { Select, TextInput } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import FilterBar from '@/components/FilterBar'
import {
  isUserRoleFilter,
  isUserSort,
  isUserStatusFilter,
  toSelectOptions,
  USER_ROLE_FILTERS,
  USER_STATUS_FILTERS,
  type UserFilterDraft,
} from '../model'
import { chrome, iconSize } from '@/theme'
import { filterFieldWidth } from '@/constants/layout'

const statusOptions = toSelectOptions(USER_STATUS_FILTERS)
const roleOptions = toSelectOptions(USER_ROLE_FILTERS)
const sortOptions = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
]

interface UserFiltersProps {
  draft: UserFilterDraft
  loading: boolean
  onDraftChange: (update: (current: UserFilterDraft) => UserFilterDraft) => void
  onApply: (draft: UserFilterDraft) => void
  onClear: () => void
}

/**
 * The backend does the filtering, so nothing here narrows the rows on screen — pressing Apply
 * asks for a different page. The shell it sits in is shared with the other four screens.
 */
export default function UserFilters({
  draft,
  loading,
  onDraftChange,
  onApply,
  onClear,
}: UserFiltersProps) {
  return (
    <FilterBar actions={{ loading, onApply: () => onApply(draft), onClear }}>
      <TextInput
        label="Search"
        placeholder="Name or email..."
        value={draft.q}
        onChange={(event) => {
          // Read before the updater runs: by the time React calls it, the event has been
          // recycled and `currentTarget` is null.
          const q = event.currentTarget.value
          onDraftChange((current) => ({ ...current, q }))
        }}
        leftSection={<IconSearch size={iconSize.inline} color={chrome.textDim} />}
        style={filterFieldWidth.search}
      />
      <Select
        label="Status"
        placeholder="Any status"
        aria-label="Filter by status"
        data={statusOptions}
        value={draft.status}
        onChange={(value) =>
          onDraftChange((current) => ({
            ...current,
            status: isUserStatusFilter(value) ? value : null,
          }))
        }
        style={filterFieldWidth.select}
        clearable
      />
      <Select
        label="Role"
        placeholder="Any role"
        aria-label="Filter by role"
        data={roleOptions}
        value={draft.role}
        onChange={(value) =>
          onDraftChange((current) => ({
            ...current,
            role: isUserRoleFilter(value) ? value : null,
          }))
        }
        style={filterFieldWidth.select}
        clearable
      />
      <Select
        label="Sort"
        aria-label="Sort by join date"
        data={sortOptions}
        value={draft.sort}
        onChange={(value) =>
          onDraftChange((current) => ({
            ...current,
            sort: isUserSort(value) ? value : current.sort,
          }))
        }
        style={filterFieldWidth.select}
        clearable={false}
      />
    </FilterBar>
  )
}
