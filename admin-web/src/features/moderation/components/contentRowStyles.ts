import type { CSSProperties } from 'react'
import { chrome } from '@/theme'
import { tableCellPadding } from '@/constants/layout'

export const contentCellStyle: CSSProperties = { padding: tableCellPadding, maxWidth: 360 }
export const cellStyle: CSSProperties = { padding: tableCellPadding }
export const nowrapCellStyle: CSSProperties = { ...cellStyle, whiteSpace: 'nowrap' }
export const breakWordStyle: CSSProperties = { wordBreak: 'break-word' }
export const replyIndentStyle: CSSProperties = { paddingLeft: 20 }
export const contentTextBoxStyle: CSSProperties = { flex: 1, minWidth: 0 }

/**
 * Past how many characters clamped text needs a tooltip to still be readable.
 *
 * Two numbers, because the two columns are not the same width — the moderation table gives
 * content 360px and the report preview 340px, and both clamp to two lines. They were a `90`
 * and an `80` in separate files with nothing saying they were related, let alone why they
 * differed. Kept together so that changing a column width means changing the number beside it.
 */
export const TOOLTIP_THRESHOLD = {
  /** The content column of the moderation table. */
  contentColumn: 90,
  /** The reported-content preview, in a narrower cell. */
  reportPreview: 80,
} as const

export function rowStyle(isLast: boolean): CSSProperties {
  return { borderBottom: isLast ? 'none' : `1px solid ${chrome.borderSubtle}` }
}
