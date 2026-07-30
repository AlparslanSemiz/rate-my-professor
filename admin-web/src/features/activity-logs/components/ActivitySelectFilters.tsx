import type { Dispatch, SetStateAction } from 'react'
import { Select, type CSSProperties } from '@mantine/core'
import type { ActivityMeta } from '../../../api/ActivityLogsService'
import { darkInputStyles } from '../../../constants/inputStyles'
import { enumLabel } from '../../../utils/enumLabel'
import {
  actorTypeOptions,
  isActivityAction,
  isActivityActorType,
  isActivityTargetType,
  type ActivityFilterDraft,
} from '../activityLogModel'

export type ActivityDraftSetter = Dispatch<SetStateAction<ActivityFilterDraft>>

const filterFieldStyle: CSSProperties = { flex: '1 1 180px' }

interface ActivitySelectFilterProps {
  meta: ActivityMeta
  onDraftChange: ActivityDraftSetter
}

/**
 * The actor list the backend serves is capped, so the free-text search is what finds a student
 * who is not in it.
 */
export function ActivityPersonFilter({
  value,
  meta,
  onDraftChange,
}: ActivitySelectFilterProps & { value: string | null }) {
  const options = meta.actors.map((actor) => ({
    value: actor.id,
    label: `${actor.name} · ${actor.email}`,
  }))

  return (
    <Select
      label="Person"
      placeholder="Everyone"
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

export function ActivityActorTypeFilter({
  value,
  meta,
  onDraftChange,
}: ActivitySelectFilterProps & { value: ActivityFilterDraft['actorType'] }) {
  const options = actorTypeOptions(meta).map((actorType) => ({
    value: actorType,
    label: enumLabel(actorType),
  }))

  return (
    <Select
      label="Who"
      placeholder="Anyone"
      data={options}
      value={value}
      onChange={(nextValue) => {
        onDraftChange((current) => ({
          ...current,
          actorType: isActivityActorType(nextValue) ? nextValue : null,
        }))
      }}
      clearable
      style={filterFieldStyle}
      styles={darkInputStyles}
    />
  )
}

export function ActivityActionFilter({
  value,
  meta,
  onDraftChange,
}: ActivitySelectFilterProps & { value: ActivityFilterDraft['action'] }) {
  const options = meta.actions.map((action) => ({ value: action, label: enumLabel(action) }))

  return (
    <Select
      label="Activity"
      placeholder="All activity"
      data={options}
      value={value}
      onChange={(nextValue) => {
        onDraftChange((current) => ({
          ...current,
          action: isActivityAction(nextValue, meta) ? nextValue : null,
        }))
      }}
      searchable
      clearable
      style={filterFieldStyle}
      styles={darkInputStyles}
    />
  )
}

export function ActivityTargetFilter({
  value,
  meta,
  onDraftChange,
}: ActivitySelectFilterProps & { value: ActivityFilterDraft['targetType'] }) {
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
          targetType: isActivityTargetType(nextValue, meta) ? nextValue : null,
        }))
      }}
      clearable
      style={filterFieldStyle}
      styles={darkInputStyles}
    />
  )
}
