import { TextInput } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import { chrome, iconSize } from '@/theme'
import { wrappingFilterFieldWidth } from '@/constants/layout'

interface SearchFilterInputProps {
  value: string
  placeholder: string
  onChange: (value: string) => void
}

/** Free-text search box for the audit log filter form. */
export function SearchFilterInput({ value, placeholder, onChange }: SearchFilterInputProps) {
  return (
    <TextInput
      label="Search"
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      leftSection={<IconSearch size={iconSize.inline} color={chrome.textDim} />}
      style={wrappingFilterFieldWidth.search}
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
      style={wrappingFilterFieldWidth.date}
    />
  )
}
