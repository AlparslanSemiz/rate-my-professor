import { type FormEvent, type CSSProperties } from 'react'
import { Button, Group } from '@mantine/core'
import { IconFilter, IconRefresh } from '@tabler/icons-react'
import type { AuditEntry, AuditMeta } from '@/api/logs'
import Panel from '@/components/Panel'
import type { FilterDraft } from '../logModel'
import type { LogScreen } from '../logScreen'
import { ActionFilter, ActorFilter, ActorTypeFilter, TargetFilter } from './LogSelectFilters'
import { DateFilterInput, SearchFilterInput } from './LogFilterInputs'
import type { DraftSetter } from './logFilterTypes'
import { iconSize } from '@/theme'

const panelStyle: CSSProperties = { padding: '16px 20px' }

interface LogFiltersProps<TEntry extends AuditEntry> {
  screen: LogScreen<TEntry>
  draft: FilterDraft
  meta: AuditMeta
  loading: boolean
  onDraftChange: DraftSetter
  onApply: (draft: FilterDraft) => void
  onClear: () => void
}

/** The filter bar above either log. What it offers is the screen's decision, not this file's. */
export default function LogFilters<TEntry extends AuditEntry>({
  screen,
  draft,
  meta,
  loading,
  onDraftChange,
  onApply,
  onClear,
}: LogFiltersProps<TEntry>) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onApply(draft)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Panel mb={16} style={panelStyle}>
        <Group gap={12} align="flex-end" wrap="wrap">
          <SearchFilterInput
            value={draft.q}
            placeholder={screen.searchPlaceholder}
            onChange={(q) => onDraftChange((current) => ({ ...current, q }))}
          />
          <ActorFilter
            value={draft.actorId}
            label={screen.actorFilterLabel}
            placeholder={screen.actorFilterPlaceholder}
            meta={meta}
            onDraftChange={onDraftChange}
          />
          {screen.offersActorTypeFilter && (
            <ActorTypeFilter value={draft.actorType} meta={meta} onDraftChange={onDraftChange} />
          )}
          <ActionFilter value={draft.action} meta={meta} onDraftChange={onDraftChange} />
          <TargetFilter value={draft.targetType} meta={meta} onDraftChange={onDraftChange} />
          <DateFilterInput
            label="From"
            ariaLabel={`${screen.noun} start date`}
            value={draft.from}
            onChange={(from) => onDraftChange((current) => ({ ...current, from }))}
          />
          <DateFilterInput
            label="To"
            ariaLabel={`${screen.noun} end date`}
            value={draft.to}
            onChange={(to) => onDraftChange((current) => ({ ...current, to }))}
          />
          <Button type="submit" leftSection={<IconFilter size={iconSize.rowAction} />} loading={loading}>
            Apply filters
          </Button>
          <Button
            type="button"
            variant="subtle"
            color="gray"
            leftSection={<IconRefresh size={iconSize.rowAction} />}
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
