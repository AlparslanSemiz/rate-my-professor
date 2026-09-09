import type { CSSProperties } from 'react'

export const catalogCellStyle: CSSProperties = { padding: '14px 20px' }
export const catalogNowrapCellStyle: CSSProperties = {
  ...catalogCellStyle,
  whiteSpace: 'nowrap',
}

export function catalogRowStyle(isLast: boolean): CSSProperties {
  return { borderBottom: isLast ? 'none' : '1px solid #1c2128' }
}
