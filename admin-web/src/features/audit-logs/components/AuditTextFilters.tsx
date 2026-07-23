import { TextInput, type CSSProperties } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import { darkInputStyles } from '../../../constants/inputStyles'
import type { DraftSetter } from './auditFilterTypes'

const searchFieldStyle: CSSProperties = { flex: '2 1 280px' }
const dateFieldStyle: CSSProperties = { flex: '1 1 150px' }

export function AuditSearchFilter({
  value,
  onDraftChange,
}: {
  value: string
  onDraftChange: DraftSetter
}) {
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

interface AuditDateFilterProps {
  label: string
  ariaLabel: string
  value: string
  onChange: (value: string) => void
}

export function AuditDateFilter({
  label,
  ariaLabel,
  value,
  onChange,
}: AuditDateFilterProps) {
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
