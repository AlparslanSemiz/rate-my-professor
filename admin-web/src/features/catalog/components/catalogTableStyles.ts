import type { CSSProperties } from 'react'
import { chrome } from '@/theme'
import { tableCellPadding } from '@/constants/layout'

export const catalogCellStyle: CSSProperties = { padding: tableCellPadding }
export const catalogNowrapCellStyle: CSSProperties = {
  ...catalogCellStyle,
  whiteSpace: 'nowrap',
}

export function catalogRowStyle(isLast: boolean): CSSProperties {
  return { borderBottom: isLast ? 'none' : `1px solid ${chrome.borderSubtle}` }
}

/**
 * The last cell of a row whose actions do not fill it.
 *
 * `F-087`: row-action groups ended at three different insets from the panel edge - 21px on
 * three tables, 46.4 and 51.3 on the two whose action column is wider than its content.
 * Aligning to the end puts every group at the cell's own padding, which is the 21px the
 * majority already had.
 */
export const catalogActionCellStyle: CSSProperties = { ...catalogCellStyle, textAlign: 'right' }
