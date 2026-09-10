import { Select } from '@mantine/core'
import type { AuditMeta } from '@/api/logs'
import {
  actorTypeOptions,
  isActorType,
  isMetaAction,
  isMetaTargetType,
  logEnumLabel,
  type FilterDraft,
} from '../logModel'
import type { DraftSetter } from './logFilterTypes'
import { wrappingFilterFieldWidth } from '@/constants/layout'

interface LogSelectFilterProps {
  meta: AuditMeta
  onDraftChange: DraftSetter
}

interface ActorFilterProps extends LogSelectFilterProps {
  value: string | null
  label: string
  placeholder: string
}

/**
 * Who acted. The options are the actors the backend reported, which it caps rather than
 * enumerating — every account that ever signed in is an actor in this table, so `q` is what
 * finds someone beyond the cap.
 */
export function ActorFilter({ value, label, placeholder, meta, onDraftChange }: ActorFilterProps) {
  const options = meta.actors.map((actor) => ({
    value: actor.id,
    label: `${actor.name} · ${actor.email}`,
  }))

  return (
    <Select
      label={label}
      placeholder={placeholder}
      data={options}
      value={value}
      onChange={(actorId) => onDraftChange((current) => ({ ...current, actorId }))}
      searchable
      clearable
      style={wrappingFilterFieldWidth.select}
    />
  )
}

interface ActionFilterProps extends LogSelectFilterProps {
  value: FilterDraft['action']
}

export function ActionFilter({ value, meta, onDraftChange }: ActionFilterProps) {
  const options = meta.actions.map((action) => ({ value: action, label: logEnumLabel(action) }))

  return (
    <Select
      label="Action"
      placeholder="All actions"
      data={options}
      value={value}
      onChange={(nextValue) => {
        onDraftChange((current) => ({
          ...current,
          action: isMetaAction(nextValue, meta) ? nextValue : null,
        }))
      }}
      clearable
      style={wrappingFilterFieldWidth.select}
    />
  )
}

interface TargetFilterProps extends LogSelectFilterProps {
  value: FilterDraft['targetType']
}

export function TargetFilter({ value, meta, onDraftChange }: TargetFilterProps) {
  const options = meta.targetTypes.map((type) => ({ value: type, label: logEnumLabel(type) }))

  return (
    <Select
      label="Target"
      placeholder="All targets"
      data={options}
      value={value}
      onChange={(nextValue) => {
        onDraftChange((current) => ({
          ...current,
          targetType: isMetaTargetType(nextValue, meta) ? nextValue : null,
        }))
      }}
      clearable
      style={wrappingFilterFieldWidth.select}
    />
  )
}

interface ActorTypeFilterProps extends LogSelectFilterProps {
  value: FilterDraft['actorType']
}

/**
 * Admin or student. Offered only by the activity log, where one table carries both; the audit
 * log's rows are administrative by definition and the control would narrow nothing.
 */
export function ActorTypeFilter({ value, meta, onDraftChange }: ActorTypeFilterProps) {
  const options = actorTypeOptions(meta).map((type) => ({ value: type, label: logEnumLabel(type) }))

  return (
    <Select
      label="Who"
      placeholder="Everyone"
      data={options}
      value={value}
      onChange={(nextValue) => {
        onDraftChange((current) => ({
          ...current,
          actorType: isActorType(nextValue) ? nextValue : null,
        }))
      }}
      clearable
      style={wrappingFilterFieldWidth.select}
    />
  )
}
