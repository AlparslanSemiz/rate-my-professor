import { type FormEvent, type CSSProperties } from 'react'
import { Button, Group } from '@mantine/core'
import { IconFilter, IconRefresh } from '@tabler/icons-react'
import type { AuditMeta } from '../../../api/AuditLogsService'
import Panel from '../../../components/Panel'
import type { FilterDraft } from '../auditLogModel'
import {
  AuditActionFilter,
  AuditAdminFilter,
  AuditTargetFilter,
} from './AuditSelectFilters'
import { AuditDateFilter, AuditSearchFilter } from './AuditTextFilters'
import type { DraftSetter } from './auditFilterTypes'

const panelStyle: CSSProperties = { padding: '16px 20px' }

interface AuditLogFiltersProps {
  draft: FilterDraft
  meta: AuditMeta
  loading: boolean
  onDraftChange: DraftSetter
  onApply: (draft: FilterDraft) => Promise<void>
  onClear: () => void
}

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
          <AuditSearchFilter value={draft.q} onDraftChange={onDraftChange} />
          <AuditAdminFilter value={draft.actorId} meta={meta} onDraftChange={onDraftChange} />
          <AuditActionFilter value={draft.action} meta={meta} onDraftChange={onDraftChange} />
          <AuditTargetFilter value={draft.targetType} meta={meta} onDraftChange={onDraftChange} />
          <AuditDateFilter
            label="From"
            ariaLabel="Audit start date"
            value={draft.from}
            onChange={(from) => onDraftChange((current) => ({ ...current, from }))}
          />
          <AuditDateFilter
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
