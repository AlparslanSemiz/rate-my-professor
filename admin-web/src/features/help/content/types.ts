import type { ComponentType } from 'react'

export type HelpIcon = ComponentType<{ size?: number; color?: string }>

export interface HelpValueRow {
  value: string
  color: string
  meaning: string
}

export interface HelpValueGroup {
  heading: string
  rows: HelpValueRow[]
}

export interface HelpActionRow {
  action: string
  result: string
}

/**
 * One screen's explanation. `valueGroups` describes what the badges and values on that screen
 * mean; `actions` describes what its controls do. Both are optional because not every screen
 * has both — the audit log has neither and is its summary alone.
 */
export interface HelpSection {
  id: string
  title: string
  icon: HelpIcon
  summary: string
  valueGroups?: HelpValueGroup[]
  readonly actions?: readonly HelpActionRow[]
}
