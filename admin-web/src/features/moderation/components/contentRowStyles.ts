import type { CSSProperties } from 'react'
import { chrome } from '@/theme'

export const contentCellStyle: CSSProperties = { padding: '16px 20px', maxWidth: 360 }
export const cellStyle: CSSProperties = { padding: '16px 20px' }
export const nowrapCellStyle: CSSProperties = { ...cellStyle, whiteSpace: 'nowrap' }
export const breakWordStyle: CSSProperties = { wordBreak: 'break-word' }
export const replyIndentStyle: CSSProperties = { paddingLeft: 20 }
export const contentTextBoxStyle: CSSProperties = { flex: 1, minWidth: 0 }

export function rowStyle(isLast: boolean): CSSProperties {
  return { borderBottom: isLast ? 'none' : `1px solid ${chrome.borderSubtle}` }
}
