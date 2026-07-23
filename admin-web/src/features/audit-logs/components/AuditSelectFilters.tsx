import { Select, type CSSProperties } from '@mantine/core'
import type { AuditMeta } from '../../../api/AuditLogsService'
import { darkInputStyles } from '../../../constants/inputStyles'
import { enumLabel } from '../../../utils/enumLabel'
import {
  isAuditAction,
  isAuditTargetType,
  type FilterDraft,
} from '../auditLogModel'
import type { DraftSetter } from './auditFilterTypes'

const filterFieldStyle: CSSProperties = { flex: '1 1 180px' }

interface AuditSelectFilterProps {
  meta: AuditMeta
  onDraftChange: DraftSetter
}

interface AuditAdminFilterProps extends AuditSelectFilterProps {
  value: string | null
}

export function AuditAdminFilter({
  value,
  meta,
  onDraftChange,
}: AuditAdminFilterProps) {
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

interface AuditActionFilterProps extends AuditSelectFilterProps {
  value: FilterDraft['action']
}

export function AuditActionFilter({
  value,
  meta,
  onDraftChange,
}: AuditActionFilterProps) {
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

interface AuditTargetFilterProps extends AuditSelectFilterProps {
  value: FilterDraft['targetType']
}

export function AuditTargetFilter({
  value,
  meta,
  onDraftChange,
}: AuditTargetFilterProps) {
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
