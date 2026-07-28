import type { Dispatch, SetStateAction } from 'react'
import { Select, type CSSProperties } from '@mantine/core'
import type { ActivityMeta } from '../../../api/ActivityLogsService'
import { darkInputStyles } from '../../../constants/inputStyles'
import { enumLabel } from '../../../utils/enumLabel'
import {
  isActivityOutcome,
  outcomeOptions,
  type ActivityFilterDraft,
} from '../activityLogModel'

export type ActivityDraftSetter = Dispatch<SetStateAction<ActivityFilterDraft>>

const filterFieldStyle: CSSProperties = { flex: '1 1 180px' }

interface ActivitySelectFilterProps {
  meta: ActivityMeta
  onDraftChange: ActivityDraftSetter
}

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

export function ActivityTypeFilter({
  value,
  meta,
  onDraftChange,
}: ActivitySelectFilterProps & { value: ActivityFilterDraft['type'] }) {
  const options = meta.types.map((type) => ({ value: type, label: enumLabel(type) }))

  return (
    <Select
      label="Activity"
      placeholder="All activity"
      data={options}
      value={value}
      onChange={(type) => onDraftChange((current) => ({ ...current, type }))}
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
      onChange={(targetType) => onDraftChange((current) => ({ ...current, targetType }))}
      clearable
      style={filterFieldStyle}
      styles={darkInputStyles}
    />
  )
}

export function ActivityOutcomeFilter({
  value,
  meta,
  onDraftChange,
}: ActivitySelectFilterProps & { value: ActivityFilterDraft['outcome'] }) {
  const options = outcomeOptions(meta).map((outcome) => ({
    value: outcome,
    label: enumLabel(outcome),
  }))

  return (
    <Select
      label="Result"
      placeholder="Any result"
      data={options}
      value={value}
      onChange={(nextValue) => {
        onDraftChange((current) => ({
          ...current,
          outcome: isActivityOutcome(nextValue) ? nextValue : null,
        }))
      }}
      clearable
      style={filterFieldStyle}
      styles={darkInputStyles}
    />
  )
}
