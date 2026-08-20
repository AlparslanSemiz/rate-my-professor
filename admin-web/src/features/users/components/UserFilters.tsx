import { type CSSProperties, type FormEvent } from 'react'
import { Button, Group, Select, TextInput } from '@mantine/core'
import { IconFilter, IconRefresh, IconSearch } from '@tabler/icons-react'
import Panel from '../../../components/Panel'
import { darkInputStyles } from '../../../constants/inputStyles'
import {
  isUserRoleFilter,
  isUserSort,
  isUserStatusFilter,
  toSelectOptions,
  USER_ROLE_FILTERS,
  USER_STATUS_FILTERS,
  type UserFilterDraft,
} from '../usersModel'

const panelStyle: CSSProperties = { padding: '16px 20px' }
const searchFieldStyle: CSSProperties = { flex: '2 1 260px' }

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
  onApply: (draft: UserFilterDraft) => Promise<void>
  onClear: () => void
}

/**
 * The backend does the filtering, so nothing here narrows the rows on screen — pressing Apply
 * asks for a different page. Laid out like the log filter forms for the same reason.
 */
export default function UserFilters({
  draft,
  loading,
  onDraftChange,
  onApply,
  onClear,
}: UserFiltersProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void onApply(draft)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Panel mb={16} style={panelStyle}>
        <Group gap={12} align="flex-end" wrap="wrap">
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
            leftSection={<IconSearch size={14} color="#6b7280" />}
            style={searchFieldStyle}
            styles={darkInputStyles}
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
            w={150}
            clearable
            styles={darkInputStyles}
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
            w={150}
            clearable
            styles={darkInputStyles}
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
            w={150}
            clearable={false}
            styles={darkInputStyles}
          />
          <Button type="submit" leftSection={<IconFilter size={15} />} loading={loading}>
            Apply filters
          </Button>
          <Button
            type="button"
            variant="subtle"
            color="gray"
            leftSection={<IconRefresh size={15} />}
            onClick={onClear}
            disabled={loading}
          >
            Clear
          </Button>
        </Group>
      </Panel>
    </form>
  )
}
