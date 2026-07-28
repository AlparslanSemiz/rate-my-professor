import { TextInput, type CSSProperties } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import { darkInputStyles } from '../constants/inputStyles'

const searchFieldStyle: CSSProperties = { flex: '2 1 280px' }
const dateFieldStyle: CSSProperties = { flex: '1 1 150px' }

interface SearchFilterInputProps {
  value: string
  placeholder: string
  onChange: (value: string) => void
}

/** Free-text search box shared by the audit and activity log filter forms. */
export function SearchFilterInput({ value, placeholder, onChange }: SearchFilterInputProps) {
  return (
    <TextInput
      label="Search"
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      leftSection={<IconSearch size={14} color="#6b7280" />}
      style={searchFieldStyle}
      styles={darkInputStyles}
    />
  )
}

interface DateFilterInputProps {
  label: string
  ariaLabel: string
  value: string
  onChange: (value: string) => void
}

export function DateFilterInput({ label, ariaLabel, value, onChange }: DateFilterInputProps) {
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
