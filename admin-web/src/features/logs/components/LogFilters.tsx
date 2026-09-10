import type { AuditEntry, AuditMeta } from '@/api/logs'
import FilterBar from '@/components/FilterBar'
import type { FilterDraft } from '../logModel'
import type { LogScreen } from '../logScreen'
import { ActionFilter, ActorFilter, ActorTypeFilter, TargetFilter } from './LogSelectFilters'
import { DateFilterInput, SearchFilterInput } from './LogFilterInputs'
import type { DraftSetter } from './logFilterTypes'

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
  return (
    <FilterBar actions={{ loading, onApply: () => onApply(draft), onClear }}>
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
    </FilterBar>
  )
}
