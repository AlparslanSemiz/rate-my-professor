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
