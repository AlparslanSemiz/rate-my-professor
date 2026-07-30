import { type FormEvent, type CSSProperties } from 'react'
import { Button, Group } from '@mantine/core'
import { IconFilter, IconRefresh } from '@tabler/icons-react'
import type { ActivityMeta } from '../../../api/ActivityLogsService'
import { DateFilterInput, SearchFilterInput } from '../../../components/LogFilterInputs'
import Panel from '../../../components/Panel'
import type { ActivityFilterDraft } from '../activityLogModel'
import {
  ActivityActionFilter,
  ActivityActorTypeFilter,
  ActivityPersonFilter,
  ActivityTargetFilter,
  type ActivityDraftSetter,
} from './ActivitySelectFilters'

const panelStyle: CSSProperties = { padding: '16px 20px' }

interface ActivityLogFiltersProps {
  draft: ActivityFilterDraft
  meta: ActivityMeta
  loading: boolean
  onDraftChange: ActivityDraftSetter
  onApply: (draft: ActivityFilterDraft) => Promise<void>
  onClear: () => void
}

export default function ActivityLogFilters({
  draft,
  meta,
  loading,
  onDraftChange,
  onApply,
  onClear,
}: ActivityLogFiltersProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void onApply(draft)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Panel mb={16} style={panelStyle}>
        <Group gap={12} align="flex-end" wrap="wrap">
          <SearchFilterInput
            value={draft.q}
            placeholder="Name, email, or target..."
            onChange={(q) => onDraftChange((current) => ({ ...current, q }))}
          />
          <ActivityPersonFilter value={draft.actorId} meta={meta} onDraftChange={onDraftChange} />
          <ActivityActorTypeFilter
            value={draft.actorType}
            meta={meta}
            onDraftChange={onDraftChange}
          />
          <ActivityActionFilter value={draft.action} meta={meta} onDraftChange={onDraftChange} />
          <ActivityTargetFilter
            value={draft.targetType}
            meta={meta}
            onDraftChange={onDraftChange}
          />
          <DateFilterInput
            label="From"
            ariaLabel="Activity start date"
            value={draft.from}
            onChange={(from) => onDraftChange((current) => ({ ...current, from }))}
          />
          <DateFilterInput
            label="To"
            ariaLabel="Activity end date"
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
