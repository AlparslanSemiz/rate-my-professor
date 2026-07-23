import { type Dispatch, type FormEvent, type SetStateAction, type CSSProperties } from 'react'
import { Button, Group, Select, TextInput } from '@mantine/core'
import { IconFilter, IconRefresh, IconSearch } from '@tabler/icons-react'
import type { AuditMeta } from '../../../api/AuditLogsService'
import Panel from '../../../components/Panel'
import { darkInputStyles } from '../../../constants/inputStyles'
import { enumLabel } from '../../../utils/enumLabel'
import { isAuditAction, isAuditTargetType, type FilterDraft } from '../auditLogModel'

const panelStyle: CSSProperties = { padding: '16px 20px' }
const filterFieldStyle: CSSProperties = { flex: '1 1 180px' }
const searchFieldStyle: CSSProperties = { flex: '2 1 280px' }
const dateFieldStyle: CSSProperties = { flex: '1 1 150px' }

interface AuditLogFiltersProps {
  draft: FilterDraft
  meta: AuditMeta
  loading: boolean
  onDraftChange: Dispatch<SetStateAction<FilterDraft>>
  onApply: (draft: FilterDraft) => Promise<void>
  onClear: () => void
}

type DraftSetter = Dispatch<SetStateAction<FilterDraft>>

export default function AuditLogFilters({
  draft,
  meta,
  loading,
  onDraftChange,
  onApply,
  onClear,
}: AuditLogFiltersProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void onApply(draft)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Panel mb={16} style={panelStyle}>
        <Group gap={12} align="flex-end" wrap="wrap">
          <SearchFilter value={draft.q} onDraftChange={onDraftChange} />
          <AdminFilter value={draft.actorId} meta={meta} onDraftChange={onDraftChange} />
          <ActionFilter value={draft.action} meta={meta} onDraftChange={onDraftChange} />
          <TargetFilter value={draft.targetType} meta={meta} onDraftChange={onDraftChange} />
          <DateFilter
            label="From"
            ariaLabel="Audit start date"
            value={draft.from}
            onChange={(from) => onDraftChange((current) => ({ ...current, from }))}
          />
          <DateFilter
            label="To"
            ariaLabel="Audit end date"
            value={draft.to}
            onChange={(to) => onDraftChange((current) => ({ ...current, to }))}
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

function SearchFilter({ value, onDraftChange }: { value: string; onDraftChange: DraftSetter }) {
  return (
    <TextInput
      label="Search"
      placeholder="Admin, email, or target..."
      value={value}
      onChange={(event) => {
        const q = event.currentTarget.value
        onDraftChange((current) => ({ ...current, q }))
      }}
      leftSection={<IconSearch size={14} color="#6b7280" />}
      style={searchFieldStyle}
      styles={darkInputStyles}
    />
  )
}

function AdminFilter({
  value,
  meta,
  onDraftChange,
}: {
  value: string | null
  meta: AuditMeta
  onDraftChange: DraftSetter
}) {
  const options = meta.actors.map((actor) => ({
    value: actor.id,
    label: `${actor.name} · ${actor.email}`,
  }))

  return (
    <Select
      label="Admin"
      placeholder="All admins"
      data={options}
      value={value}
      onChange={(actorId) => onDraftChange((current) => ({ ...current, actorId }))}
      searchable
      clearable
      style={filterFieldStyle}
      styles={darkInputStyles}
    />
  )
}

function ActionFilter({
  value,
  meta,
  onDraftChange,
}: {
  value: FilterDraft['action']
  meta: AuditMeta
  onDraftChange: DraftSetter
}) {
  const options = meta.actions.map((action) => ({ value: action, label: enumLabel(action) }))

  return (
    <Select
      label="Action"
      placeholder="All actions"
      data={options}
      value={value}
      onChange={(nextValue) => {
        onDraftChange((current) => ({
          ...current,
          action: isAuditAction(nextValue, meta) ? nextValue : null,
        }))
      }}
      clearable
      style={filterFieldStyle}
      styles={darkInputStyles}
    />
  )
}

function TargetFilter({
  value,
  meta,
  onDraftChange,
}: {
  value: FilterDraft['targetType']
  meta: AuditMeta
  onDraftChange: DraftSetter
}) {
  const options = meta.targetTypes.map((type) => ({ value: type, label: enumLabel(type) }))

  return (
    <Select
      label="Target"
      placeholder="All targets"
      data={options}
      value={value}
      onChange={(nextValue) => {
        onDraftChange((current) => ({
          ...current,
          targetType: isAuditTargetType(nextValue, meta) ? nextValue : null,
        }))
      }}
      clearable
      style={filterFieldStyle}
      styles={darkInputStyles}
    />
  )
}

interface DateFilterProps {
  label: string
  ariaLabel: string
  value: string
  onChange: (value: string) => void
}

function DateFilter({ label, ariaLabel, value, onChange }: DateFilterProps) {
  return (
    <TextInput
      label={label}
      type="date"
      aria-label={ariaLabel}
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      style={dateFieldStyle}
      styles={darkInputStyles}
    />
  )
}
